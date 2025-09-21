const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database');
const router = express.Router();

// Get user profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.params.id;
    
    // Check if user is requesting their own profile or if the profile is public
    const user = await db.get(
      'SELECT id, username, email, first_name, last_name, age, bio, avatar_color, avatar_icon, profile_photo, xp, level, share_progress, public_profile, created_at FROM users WHERE id = ?',
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
      'SELECT id, username, email, first_name, last_name, age, bio, avatar_color, avatar_icon, profile_photo, xp, level, share_progress, public_profile, created_at FROM users WHERE id = ?',
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
      publicProfile 
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
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, values);
    
    // Return updated user profile
    const updatedUser = await db.get(
      'SELECT id, username, email, first_name, last_name, age, bio, avatar_color, avatar_icon, profile_photo, xp, level, share_progress, public_profile, updated_at FROM users WHERE id = ?',
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
    const totalHabits = totalHabitsResult.count;
    
    // Get total completions
    const totalCompletionsResult = await db.get(
      'SELECT COUNT(*) as count FROM habit_completions WHERE user_id = ?',
      [userId]
    );
    const totalCompletions = totalCompletionsResult.count;
    
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
        const today = new Date().toISOString().split('T')[0];
        let currentDate = new Date(today);
        
        // Check current streak
        for (const completion of completions) {
          const completionDate = completion.date;
          const expectedDate = currentDate.toISOString().split('T')[0];
          
          if (completionDate === expectedDate) {
            habitCurrentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        // Calculate longest streak
        tempStreak = 1;
        for (let i = 1; i < completions.length; i++) {
          const current = new Date(completions[i-1].date);
          const next = new Date(completions[i].date);
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
    
    // Calculate success rate
    const expectedCompletions = totalHabits * 30; // Rough estimate for last 30 days
    const successRate = expectedCompletions > 0 ? Math.round((totalCompletions / expectedCompletions) * 100) : 0;
    
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
      currentStreak,
      longestStreak,
      successRate,
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
