const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');

const router = express.Router();

// Get all habits for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, sort, order } = req.query;
    
    let query = `
      SELECT h.*, 
             COUNT(hc.id) as completion_count,
             MAX(hc.date) as last_completion
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = ?
    `;
    
    const params = [req.user.id];
    
    if (category && category !== 'all') {
      query += ' AND h.category = ?';
      params.push(category);
    }
    
    query += ' GROUP BY h.id';
    
    // Add sorting
    const validSorts = ['name', 'created_at', 'category'];
    const validOrders = ['ASC', 'DESC'];
    
    if (validSorts.includes(sort)) {
      const sortOrder = validOrders.includes(order?.toUpperCase()) ? order.toUpperCase() : 'ASC';
      query += ` ORDER BY h.${sort} ${sortOrder}`;
    } else {
      query += ' ORDER BY h.created_at DESC';
    }

    const habits = await getDatabase().all(query, params);

    // Get completions for each habit to calculate streaks
    const habitsWithStreaks = await Promise.all(habits.map(async (habit) => {
      const completions = await getDatabase().all(
        'SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
        [habit.id]
      );

      const streak = calculateStreak(completions.map(row => row.date));
      
      return {
        ...habit,
        completedDates: completions.map(row => {
          // Ensure we always return dates as YYYY-MM-DD strings
          const dateValue = row.date;
          
          if (typeof dateValue === 'string') {
            // If it's already a string, check if it's ISO format and extract date part
            return dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
          } else if (dateValue instanceof Date) {
            // If it's a Date object, convert to YYYY-MM-DD
            return dateValue.toISOString().split('T')[0];
          } else {
            // Fallback: convert to string and extract date
            return new Date(dateValue).toISOString().split('T')[0];
          }
        }),
        streak
      };
    }));

    res.json({ habits: habitsWithStreaks });

  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new habit
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('category').isIn(['health', 'sport', 'learning', 'productivity', 'mindfulness', 'social', 'other']),
  body('frequency').isIn(['daily', 'weekly', 'monthly']),
  body('notes').optional().isLength({ max: 500 }),
  body('target').optional().isInt({ min: 1 }),
  body('unit').optional().isLength({ max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, category, frequency, notes, target, unit, color, icon } = req.body;
    const habitId = uuidv4();

    await getDatabase().run(
      `INSERT INTO habits (
        id, user_id, name, category, frequency, notes, target, unit, color, icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [habitId, req.user.id, name, category, frequency, notes || null, target || 1, unit || null, color || null, icon || null]
    );

    const habit = await getDatabase().get('SELECT * FROM habits WHERE id = ?', [habitId]);

    res.status(201).json({ 
      message: 'Habit created successfully', 
      habit: { ...habit, completedDates: [], streak: 0 }
    });

  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complete/uncomplete a habit
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 Completion request received:', {
      habitId: req.params.id,
      userId: req.user?.id,
      body: req.body
    });
    
    const { id } = req.params;
    const { date, notes, mood, value } = req.body || {}; // Handle undefined body
    
    const completionDate = date || new Date().toISOString().split('T')[0];

    // Check if habit belongs to user
    const habit = await getDatabase().get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
    console.log('🔍 Found habit:', habit ? 'Yes' : 'No');

    if (!habit) {
      console.log('❌ Habit not found for user');
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if already completed for this date
    const existingCompletion = await getDatabase().get(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
      [id, completionDate]
    );

    console.log('🔍 Checking completion for date:', completionDate);
    console.log('🔍 Existing completion found:', existingCompletion ? 'Yes' : 'No');
    if (existingCompletion) {
      console.log('🗓️ Existing completion data:', existingCompletion);
    }

    if (existingCompletion) {
      // Remove completion
      await getDatabase().run(
        'DELETE FROM habit_completions WHERE id = ?',
        [existingCompletion.id]
      );

      res.json({ message: 'Habit unmarked as completed', completed: false });
    } else {
      // Add completion
      const completionId = uuidv4();
      
      await getDatabase().run(
        `INSERT INTO habit_completions (
          id, habit_id, user_id, date, value, notes, mood
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [completionId, id, req.user.id, completionDate, value || 1, notes || null, mood || null]
      );

      // Update user XP
      const xpGain = 10;
      await getDatabase().run(
        'UPDATE users SET xp = xp + ? WHERE id = ?',
        [xpGain, req.user.id]
      );

      res.json({ message: 'Habit marked as completed', completed: true, xpGained: xpGain });
    }

  } catch (error) {
    console.error('Complete habit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a habit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if habit belongs to user
    const habit = await getDatabase().get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Delete habit (cascading deletes will handle completions and comments)
    await getDatabase().run('DELETE FROM habits WHERE id = ?', [id]);

    res.json({ message: 'Habit deleted successfully' });

  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get habit statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Get basic stats
    const stats = await getDatabase().get(`
      SELECT 
        COUNT(DISTINCT h.id) as total_habits,
        COUNT(DISTINCT CASE WHEN hc.date = CURRENT_DATE THEN h.id END) as completed_today,
        COUNT(DISTINCT hc.id) as total_completions
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = ?
    `, [req.user.id]);

    // Get category breakdown
    const categoryStats = await getDatabase().all(`
      SELECT 
        h.category,
        COUNT(h.id) as count,
        COUNT(hc.id) as completions
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = ?
      GROUP BY h.category
    `, [req.user.id]);

    res.json({
      ...stats,
      categoryBreakdown: categoryStats.reduce((acc, stat) => {
        acc[stat.category] = {
          count: stat.count,
          completions: stat.completions
        };
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to calculate streak
function calculateStreak(completedDates) {
  if (completedDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const sortedDates = completedDates.sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let currentDate = new Date(today);

  for (const dateStr of sortedDates) {
    const completionDate = new Date(dateStr);
    const dayDiff = Math.floor((currentDate - completionDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dayDiff === streak + 1 && streak === 0) {
      // Today not completed but yesterday was
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = router;
