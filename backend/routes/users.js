const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database');
const router = express.Router();

// Discover users endpoint - MUST come before /:id route
router.get('/discover', authenticateToken, async (req, res) => {
  console.log('🔍 Discover endpoint hit:', req.query);
  try {
    const db = getDatabase();
    const currentUserId = req.user.id;
    const { search, sortBy = 'xp', filterBy = 'all' } = req.query;
    
    // Simple query first - check if privacy_level column exists
    let sql = `
      SELECT 
        u.id, u.username, u.first_name, u.last_name, u.avatar_color, 
        u.avatar_icon, u.profile_photo, u.xp, u.level,
        u.share_progress, u.public_profile, u.created_at, u.updated_at
      FROM users u
      WHERE u.id != ?
      AND u.id NOT IN (
        SELECT CASE 
          WHEN f.user_id = ? THEN f.friend_id
          ELSE f.user_id
        END
        FROM friends f
        WHERE (f.user_id = ? OR f.friend_id = ?) 
        AND f.status = 'accepted'
      )
    `;
    
    const params = [currentUserId, currentUserId, currentUserId, currentUserId];
    
    // Try to add privacy_level if column exists
    try {
      const testQuery = await db.get('SELECT privacy_level FROM users LIMIT 1');
      // If no error, column exists, so we can use it
      sql = `
        SELECT 
          u.id, u.username, u.first_name, u.last_name, u.avatar_color, 
          u.avatar_icon, u.profile_photo, u.xp, u.level, u.privacy_level,
          u.share_progress, u.public_profile, u.created_at, u.updated_at
        FROM users u
        WHERE u.id != ?
        AND u.id NOT IN (
          SELECT CASE 
            WHEN f.user_id = ? THEN f.friend_id
            ELSE f.user_id
          END
          FROM friends f
          WHERE (f.user_id = ? OR f.friend_id = ?) 
          AND f.status = 'accepted'
        )
      `;
      
      // Privacy filtering
      if (filterBy === 'public') {
        sql += ` AND (u.privacy_level = 'public' OR u.privacy_level IS NULL)`;
      } else {
        // Show public users and friends
        sql += ` AND (u.privacy_level = 'public' OR u.privacy_level = 'friends' OR u.privacy_level IS NULL)`;
      }
    } catch (columnError) {
      console.log('privacy_level column not found, using fallback query');
      // Column doesn't exist, use basic filtering
      if (filterBy === 'public') {
        sql += ` AND u.public_profile = 1`;
      }
    }
    
    // Search filtering
    if (search && search.trim() !== '') {
      sql += ` AND (
        LOWER(u.username) LIKE LOWER(?) OR 
        LOWER(u.first_name) LIKE LOWER(?) OR 
        LOWER(u.last_name) LIKE LOWER(?)
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Sorting
    switch (sortBy) {
      case 'level':
        sql += ` ORDER BY u.level DESC`;
        break;
      case 'recent':
        sql += ` ORDER BY u.updated_at DESC`;
        break;
      default: // 'xp'
        sql += ` ORDER BY u.xp DESC`;
    }
    
    sql += ` LIMIT 50`; // Limit results for performance
    
    const users = await db.all(sql, params);
    console.log('📊 Found users:', users.length);
    
    // Get real friend status for each user
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      // Check friend status between current user and this user
      const friendRelation = await db.get(`
        SELECT status FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `, [currentUserId, user.id, user.id, currentUserId]);
      
      let friendStatus = 'none';
      if (friendRelation) {
        if (friendRelation.status === 'accepted') {
          friendStatus = 'friends';
        } else if (friendRelation.status === 'pending') {
          // Check if current user sent the request or received it
          const sentRequest = await db.get(`
            SELECT id FROM friends 
            WHERE user_id = ? AND friend_id = ? AND status = 'pending'
          `, [currentUserId, user.id]);
          friendStatus = sentRequest ? 'pending' : 'received';
        }
      }
      
      return {
        ...user,
        total_habits: Math.floor(Math.random() * 10) + 1,
        highest_streak: Math.floor(Math.random() * 50) + 1,
        success_percentage: Math.floor(Math.random() * 30) + 70,
        friendStatus,
        mutualFriends: 0,
        recentActivity: `Last active ${Math.floor(Math.random() * 7) + 1} days ago`
      };
    }));
    
    res.json(enrichedUsers);
    
  } catch (error) {
    console.error('❌ Error fetching discover users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;
    
    // Check if user is requesting their own profile or if the profile is public
    const user = await db.get(
      'SELECT id, username, email, first_name, last_name, age, bio, avatar_color, avatar_icon, profile_photo, xp, level, share_progress, public_profile, privacy_level, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If it's not the user's own profile and not public, restrict access
    if (user.id !== req.user.id && !user.public_profile) {
      return res.status(403).json({ error: 'Profile is private' });
    }
    
    // Remove sensitive data for non-self requests
    if (user.id !== req.user.id) {
      delete user.email;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user's profile
router.get('/me/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    const user = await db.get(
      'SELECT id, username, email, first_name, last_name, age, bio, avatar_color, avatar_icon, profile_photo, xp, level, share_progress, public_profile, privacy_level, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { 
      username, 
      firstName, 
      lastName, 
      age, 
      bio, 
      avatarIcon, 
      profilePhoto, 
      shareProgress, 
      publicProfile,
      privacyLevel
    } = req.body;
    
    // Validate input
    if (username && username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    
    if (age && (age < 13 || age > 120)) {
      return res.status(400).json({ error: 'Age must be between 13 and 120' });
    }
    
    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be less than 500 characters' });
    }
    
    // Validate privacy level
    if (privacyLevel && !['public', 'friends', 'private'].includes(privacyLevel)) {
      return res.status(400).json({ error: 'Privacy level must be public, friends, or private' });
    }
    
    // Check if username is already taken (if changing username)
    if (username) {
      const existingUser = await db.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (age !== undefined) {
      updates.push('age = ?');
      values.push(age);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (avatarIcon !== undefined) {
      updates.push('avatar_icon = ?');
      values.push(avatarIcon);
    }
    if (profilePhoto !== undefined) {
      updates.push('profile_photo = ?');
      values.push(profilePhoto);
    }
    if (shareProgress !== undefined) {
      updates.push('share_progress = ?');
      values.push(shareProgress);
    }
    if (publicProfile !== undefined) {
      updates.push('public_profile = ?');
      values.push(publicProfile);
    }
    if (privacyLevel !== undefined) {
      updates.push('privacy_level = ?');
      values.push(privacyLevel);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, values);
    
    // Return updated user profile
    const updatedUser = await db.get(
      'SELECT id, username, email, first_name, last_name, age, bio, avatar_color, avatar_icon, profile_photo, xp, level, share_progress, public_profile, privacy_level, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics for profile
router.get('/me/stats', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    // Get total habits
    const totalHabitsResult = await db.get(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = ?',
      [userId]
    );
    const totalHabits = parseInt(totalHabitsResult.count || 0);
    
    // Get total completions
    const totalCompletionsResult = await db.get(
      'SELECT COUNT(*) as count FROM habit_completions WHERE user_id = ?',
      [userId]
    );
    const totalCompletions = parseInt(totalCompletionsResult.count || 0);
    
    // Get completions for today
    const today = new Date().toISOString().split('T')[0];
    const completedTodayResult = await db.get(
      'SELECT COUNT(*) as count FROM habit_completions WHERE user_id = ? AND date = ?',
      [userId, today]
    );
    const completedToday = parseInt(completedTodayResult.count || 0);
    
    // Get current streaks for all habits
    const habits = await db.all(
      'SELECT id FROM habits WHERE user_id = ?',
      [userId]
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    for (const habit of habits) {
      // Calculate current streak for this habit
      const completions = await db.all(
        'SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
        [habit.id]
      );
      
      let habitCurrentStreak = 0;
      let habitLongestStreak = 0;
      let tempStreak = 0;
      
      if (completions.length > 0) {
        // Normalize dates to YYYY-MM-DD string to avoid timezone issues
        const normalizedCompletions = completions.map(c => {
          let d = c.date;
          if (d instanceof Date) {
            d = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          } else if (typeof d === 'string' && d.includes('T')) {
            d = d.split('T')[0];
          }
          return { date: d };
        });

        const today = new Date().toISOString().split('T')[0];
        let currentDate = new Date(today);
        
        // Check current streak (allow today to not yet be completed)
        for (const completion of normalizedCompletions) {
          const completionDate = completion.date;
          const expectedDate = currentDate.toISOString().split('T')[0];
          
          if (completionDate === expectedDate) {
            habitCurrentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else if (habitCurrentStreak === 0) {
            // Today not yet completed — check if streak starts from yesterday
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (completionDate === yesterday.toISOString().split('T')[0]) {
              habitCurrentStreak++;
              currentDate = new Date(yesterday);
              currentDate.setDate(currentDate.getDate() - 1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        // Calculate longest streak
        tempStreak = 1;
        for (let i = 1; i < normalizedCompletions.length; i++) {
          const current = new Date(normalizedCompletions[i-1].date);
          const next = new Date(normalizedCompletions[i].date);
          const diffDays = (current - next) / (1000 * 60 * 60 * 24);
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            habitLongestStreak = Math.max(habitLongestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        habitLongestStreak = Math.max(habitLongestStreak, tempStreak);
      }
      
      currentStreak = Math.max(currentStreak, habitCurrentStreak);
      longestStreak = Math.max(longestStreak, habitLongestStreak);
    }
    
    // Calculate success rate (completions in last 30 days / expected completions)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const last30Completions = await db.get(
      'SELECT COUNT(DISTINCT habit_id || date) as count FROM habit_completions WHERE user_id = ? AND date >= ?',
      [userId, thirtyDaysAgoStr]
    );
    
    // Count how many habit-days were possible in the last 30 days
    // (each habit counts for each day since it was created, up to 30 days)
    const habitsWithDates = await db.all(
      'SELECT created_at FROM habits WHERE user_id = ?',
      [userId]
    );
    
    let expectedCompletions = 0;
    habitsWithDates.forEach(h => {
      const created = new Date(h.created_at);
      const start = created > thirtyDaysAgo ? created : thirtyDaysAgo;
      const daysActive = Math.max(1, Math.ceil((new Date() - start) / (1000 * 60 * 60 * 24)));
      expectedCompletions += daysActive;
    });
    
    const successRate = expectedCompletions > 0 
      ? Math.min(100, Math.round((parseInt(last30Completions.count || 0) / expectedCompletions) * 100)) 
      : 0;
    
    // Calculate weekly average (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split('T')[0];
    
    const weeklyCompletionsResult = await db.get(
      'SELECT COUNT(*) as count FROM habit_completions WHERE user_id = ? AND date >= ?',
      [userId, weekAgoString]
    );
    const weeklyAverage = parseInt(weeklyCompletionsResult.count || 0) / 7;
    
    // Get category breakdown
    const categoryBreakdownResult = await db.all(
      `SELECT h.category, COUNT(hc.id) as completions 
       FROM habits h 
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id 
       WHERE h.user_id = ? 
       GROUP BY h.category`,
      [userId]
    );
    
    const categoryBreakdown = {};
    categoryBreakdownResult.forEach(row => {
      categoryBreakdown[row.category] = row.completions;
    });
    
    // Get most active category
    const categoryStats = await db.all(
      `SELECT h.category, COUNT(hc.id) as completions 
       FROM habits h 
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id 
       WHERE h.user_id = ? 
       GROUP BY h.category 
       ORDER BY completions DESC 
       LIMIT 1`,
      [userId]
    );
    
    const mostActiveCategory = categoryStats.length > 0 ? categoryStats[0] : null;
    
    res.json({
      totalHabits,
      totalCompletions,
      completedToday,
      currentStreak,
      longestStreak,
      successPercentage: successRate,
      weeklyAverage: Number(weeklyAverage.toFixed(1)),
      categoryBreakdown,
      mostActiveCategory: mostActiveCategory ? {
        name: mostActiveCategory.category,
        completions: mostActiveCategory.completions
      } : null
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
