const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database');
const router = express.Router();

// Get all groups (with filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const currentUserId = req.user.id;
    const { 
      search, 
      status = 'all', 
      type = 'all' // 'my-groups', 'discover', 'all'
    } = req.query;
    
    console.log('🏆 Groups endpoint called for user:', currentUserId);
    console.log('📋 Query params:', { search, status, type });

    let sql = `
      SELECT 
        g.*,
        u.username as creator_username,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COUNT(DISTINCT gm.id) as member_count,
        CASE 
          WHEN g.creator_id = ? THEN true
          WHEN gm_current.user_id IS NOT NULL THEN true
          ELSE false
        END as is_member
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm_current ON g.id = gm_current.group_id AND gm_current.user_id = ?
    `;
    
    const params = [currentUserId, currentUserId];
    const whereConditions = [];

    // Filter by type
    if (type === 'my-groups') {
      whereConditions.push('(g.creator_id = ? OR gm_current.user_id IS NOT NULL)');
      params.push(currentUserId);
    } else if (type === 'discover') {
      whereConditions.push('g.is_public = true');
      whereConditions.push('(g.creator_id != ? AND gm_current.user_id IS NULL)');
      params.push(currentUserId);
    }

    // Filter by search
    if (search && search.trim() !== '') {
      whereConditions.push('(LOWER(g.name) LIKE LOWER(?) OR LOWER(g.habit_name) LIKE LOWER(?))');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Filter by status
    if (status !== 'all') {
      whereConditions.push('g.status = ?');
      params.push(status);
    }

    // Add WHERE clause if we have conditions
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += `
      GROUP BY g.id, u.username, u.first_name, u.last_name, gm_current.user_id
      ORDER BY g.created_at DESC
    `;

    const groups = await db.all(sql, params);
    console.log('📊 Found groups:', groups.length);
    
    // Debug: Log each group's membership status
    groups.forEach(group => {
      console.log(`🔍 Group: ${group.name} - is_member: ${group.is_member} - creator: ${group.creator_id === currentUserId}`);
    });

    // Update group status based on dates
    const today = new Date().toISOString().split('T')[0];
    const updatedGroups = groups.map(group => {
      let calculatedStatus = group.status;
      
      if (group.start_date > today) {
        calculatedStatus = 'upcoming';
      } else if (group.end_date < today) {
        calculatedStatus = 'completed';
      } else {
        calculatedStatus = 'active';
      }

      return {
        ...group,
        status: calculatedStatus,
        is_member: Boolean(group.is_member)
      };
    });

    res.json(updatedGroups);
    
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single group with detailed info
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    console.log('🏆 Group detail endpoint called:', groupId);

    // Get group info
    const group = await db.get(`
      SELECT 
        g.*,
        u.username as creator_username,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COUNT(DISTINCT gm.id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id = ?
      GROUP BY g.id, u.username, u.first_name, u.last_name
    `, [groupId]);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is member
    const membership = await db.get(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `, [groupId, currentUserId]);

    const isMember = Boolean(membership) || group.creator_id === currentUserId;
    const isCreator = group.creator_id === currentUserId;

    // If not public and user is not member, restrict access
    if (!group.is_public && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get group members with their progress (only if user is member)
    let members = [];
    if (isMember) {
      members = await getGroupMembers(db, groupId);
    }

    // Update status based on dates
    const today = new Date().toISOString().split('T')[0];
    let calculatedStatus = group.status;
    
    if (group.start_date > today) {
      calculatedStatus = 'upcoming';
    } else if (group.end_date < today) {
      calculatedStatus = 'completed';
    } else {
      calculatedStatus = 'active';
    }

    res.json({
      ...group,
      status: calculatedStatus,
      is_member: isMember,
      is_creator: isCreator,
      members: members
    });
    
  } catch (error) {
    console.error('❌ Error fetching group details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const currentUserId = req.user.id;
    const {
      name,
      description,
      habit_name,
      habit_category,
      start_date,
      end_date,
      target_frequency = 7,
      is_public = true
    } = req.body;

    console.log('🏆 Creating new group:', name);

    // Validate required fields
    if (!name || !habit_name || !habit_category || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, habit_name, habit_category, start_date, end_date' 
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    if (endDate < today) {
      return res.status(400).json({ error: 'End date must be in the future' });
    }

    // Validate target frequency
    if (target_frequency < 1 || target_frequency > 7) {
      return res.status(400).json({ error: 'Target frequency must be between 1 and 7 days per week' });
    }

    // Create group
    const groupId = uuidv4();
    const status = startDate > today ? 'upcoming' : 'active';

    await db.run(`
      INSERT INTO groups (
        id, name, description, habit_name, habit_category, 
        creator_id, start_date, end_date, target_frequency, 
        is_public, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      groupId, name, description, habit_name, habit_category,
      currentUserId, start_date, end_date, target_frequency,
      is_public, status
    ]);

    // Add creator as first member
    await db.run(`
      INSERT INTO group_members (
        id, group_id, user_id, role
      ) VALUES (?, ?, ?, ?)
    `, [uuidv4(), groupId, currentUserId, 'admin']);

    console.log('✅ Group created successfully:', groupId);

    // Return the created group
    const createdGroup = await db.get(`
      SELECT 
        g.*,
        u.username as creator_username,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        1 as member_count
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      WHERE g.id = ?
    `, [groupId]);

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...createdGroup,
        is_member: true,
        is_creator: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating group:', error);
    if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Group name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Join group
router.post('/:groupId/join', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    console.log('🏆 User joining group:', groupId, 'User:', currentUserId);

    // Check if group exists and is public
    const group = await db.get('SELECT * FROM groups WHERE id = ?', [groupId]);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.is_public) {
      return res.status(403).json({ error: 'Group is private' });
    }

    // Check if already a member
    const existingMember = await db.get(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, currentUserId]);

    console.log('🔍 Checking membership:', { groupId, currentUserId, existingMember });

    if (existingMember) {
      console.log('❌ User is already a member');
      return res.status(409).json({ error: 'Already a member of this group' });
    }

    // Add as member
    await db.run(`
      INSERT INTO group_members (id, group_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), groupId, currentUserId, 'member']);

    console.log('✅ User successfully joined group');
    res.json({ message: 'Successfully joined group' });
    
  } catch (error) {
    console.error('❌ Error joining group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave group
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    console.log('🏆 User leaving group:', groupId, 'User:', currentUserId);

    // Check if user is group creator
    const group = await db.get('SELECT creator_id FROM groups WHERE id = ?', [groupId]);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator_id === currentUserId) {
      return res.status(400).json({ error: 'Group creator cannot leave the group. Delete the group instead.' });
    }

    // Remove from group
    const result = await db.run(`
      DELETE FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, currentUserId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }

    console.log('✅ User successfully left group');
    res.json({ message: 'Successfully left group' });
    
  } catch (error) {
    console.error('❌ Error leaving group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark habit completion for group
router.post('/:groupId/complete', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { groupId } = req.params;
    const currentUserId = req.user.id;
    const { date = new Date().toISOString().split('T')[0], notes } = req.body;

    console.log('🏆 Marking completion for group:', groupId, 'Date:', date);

    // Debug: Show exactly what dates we're working with
    const requestDate = date || new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowUTC = now.toISOString().split('T')[0];
    const nowLocal = now.toDateString();
    console.log('🔍 Debug dates:');
    console.log('  - Request date:', requestDate);
    console.log('  - Current UTC date:', nowUTC);
    console.log('  - Current local date:', nowLocal);
    console.log('  - Timezone offset:', now.getTimezoneOffset());

    // Verify user is member
    const membership = await db.get(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, currentUserId]);

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Verify group is active
    const group = await db.get('SELECT * FROM groups WHERE id = ?', [groupId]);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const completionDate = new Date(date).toISOString().split('T')[0];
    if (completionDate < group.start_date || completionDate > group.end_date) {
      return res.status(400).json({ error: 'Completion date is outside group duration' });
    }

    // Check if already completed for this date
    // Handle timezone: convert stored UTC timestamp to local date for comparison
    // UTC+3 timezone offset: add 3 hours to UTC time, then extract date
    const existingCompletion = await db.get(`
      SELECT id, completion_date,
             (completion_date + INTERVAL '3 hours')::date as local_completion_date
      FROM group_completions 
      WHERE group_id = ? AND user_id = ? 
      AND (completion_date + INTERVAL '3 hours')::date = ?::date
    `, [groupId, currentUserId, completionDate]);

    console.log('🔍 Checking existing completion:');
    console.log('  - Query params:', [groupId, currentUserId, completionDate]);
    console.log('  - Existing completion found:', existingCompletion);

    // Debug: Show all completions for this user in this group
    const allCompletions = await db.all(`
      SELECT completion_date, notes FROM group_completions 
      WHERE group_id = ? AND user_id = ?
      ORDER BY completion_date DESC
    `, [groupId, currentUserId]);
    console.log('📋 All completions for this user in group:', allCompletions);

    if (existingCompletion) {
      console.log('❌ Completion already exists for date:', completionDate);
      return res.status(409).json({ error: 'Already completed for this date' });
    }

    // Add completion
    await db.run(`
      INSERT INTO group_completions (id, group_id, user_id, completion_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [uuidv4(), groupId, currentUserId, completionDate, notes]);

    // Update member stats
    await updateMemberStats(db, groupId, currentUserId);

    console.log('✅ Completion recorded successfully');
    res.json({ message: 'Completion recorded successfully' });
    
  } catch (error) {
    console.error('❌ Error recording completion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove habit completion for group
router.delete('/:groupId/complete', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { groupId } = req.params;
    const currentUserId = req.user.id;
    const { date = new Date().toISOString().split('T')[0] } = req.body;

    console.log('🏆 Removing completion for group:', groupId, 'Date:', date);

    // Remove completion
    const result = await db.run(`
      DELETE FROM group_completions 
      WHERE group_id = ? AND user_id = ? AND completion_date = ?
    `, [groupId, currentUserId, date]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'No completion found for this date' });
    }

    // Update member stats
    await updateMemberStats(db, groupId, currentUserId);

    console.log('✅ Completion removed successfully');
    res.json({ message: 'Completion removed successfully' });
    
  } catch (error) {
    console.error('❌ Error removing completion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get group members with progress
async function getGroupMembers(db, groupId) {
  const members = await db.all(`
    SELECT 
      gm.*,
      u.username,
      u.first_name,
      u.last_name,
      u.avatar_color,
      u.avatar_icon
    FROM group_members gm
    LEFT JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
    ORDER BY gm.total_completions DESC, gm.completion_rate DESC
  `, [groupId]);

  // Get recent completions for each member (last 7 days)
  const membersWithProgress = await Promise.all(members.map(async (member, index) => {
    const completions = await db.all(`
      SELECT completion_date 
      FROM group_completions 
      WHERE group_id = ? AND user_id = ?
      AND completion_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY completion_date DESC
    `, [groupId, member.user_id]);

    // Create daily completion map for last 7 days
    const dailyCompletions = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
      dailyCompletions[dateStr] = false;
    }

    // Mark completed days - convert UTC timestamp to local date string
    completions.forEach(completion => {
      // Convert UTC timestamp to local date accounting for timezone
      const completionDate = new Date(completion.completion_date);
      // Add 3 hours for UTC+3 timezone
      completionDate.setHours(completionDate.getHours() + 3);
      const localDateStr = completionDate.toISOString().split('T')[0];
      
      console.log('🗓️ Processing completion:', {
        original: completion.completion_date,
        converted: localDateStr,
        available_keys: Object.keys(dailyCompletions)
      });
      
      dailyCompletions[localDateStr] = true;
    });

    return {
      ...member,
      rank: index + 1,
      daily_completions: dailyCompletions
    };
  }));

  return membersWithProgress;
}

// Helper function to update member statistics
async function updateMemberStats(db, groupId, userId) {
  // Get group info
  const group = await db.get('SELECT start_date, end_date, target_frequency FROM groups WHERE id = ?', [groupId]);
  if (!group) return;

  // Calculate total days in group duration
  const startDate = new Date(group.start_date);
  const endDate = new Date(group.end_date);
  const today = new Date();
  const effectiveEndDate = endDate > today ? today : endDate;
  
  const totalDays = Math.max(1, Math.ceil((effectiveEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
  
  // Get all completions for this user in this group
  const completions = await db.all(`
    SELECT completion_date 
    FROM group_completions 
    WHERE group_id = ? AND user_id = ?
    ORDER BY completion_date ASC
  `, [groupId, userId]);

  const totalCompletions = completions.length;
  const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100 * 100) / 100 : 0;

  // Calculate current streak
  let currentStreak = 0;
  if (completions.length > 0) {
    const sortedDates = completions.map(c => c.completion_date).sort((a, b) => new Date(b) - new Date(a));
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if completed today or yesterday to start streak
    let checkDate = new Date(today);
    if (!sortedDates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days backwards
    for (const dateStr of sortedDates) {
      const completionDate = checkDate.toISOString().split('T')[0];
      if (dateStr === completionDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const lastCompletionDate = completions.length > 0 ? completions[completions.length - 1].completion_date : null;

  // Update member stats
  await db.run(`
    UPDATE group_members 
    SET 
      total_completions = ?,
      completion_rate = ?,
      current_streak = ?,
      last_completion_date = ?
    WHERE group_id = ? AND user_id = ?
  `, [totalCompletions, completionRate, currentStreak, lastCompletionDate, groupId, userId]);
}

module.exports = router;
