const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { calculateStreak } = require('../utils/streakCalculator');

const router = express.Router();

// Get all habits for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, sort, order } = req.query;
    const userId = req.user.id;
    
    console.log(`🔍 Fetching fresh habits for user ${userId}`);
    
    let query = `
      SELECT h.*, 
             COUNT(hc.id) as completion_count,
             MAX(hc.date) as last_completion
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = ?
    `;
    
    const params = [userId];
    
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
    console.log(`📋 Found ${habits.length} habits in database`);

    // Get completions for each habit to calculate streaks
    const habitsWithStreaks = await Promise.all(habits.map(async (habit) => {
      const completions = await getDatabase().all(
        'SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
        [habit.id]
      );

      console.log(`🔍 Raw completions for habit ${habit.id}:`, completions);

      // Wait to calculate streak AFTER formatting dates
      // const streak = calculateStreak(completions.map(row => row.date));
      
      // Get today's date for comparison
      const today = new Date().toISOString().split('T')[0];
      
      const completedDates = completions.map(row => {
        // Handle different date formats that might come from the database
        let dateString = row.date;
        
        // If it's a Date object (which it appears to be from PostgreSQL)
        if (dateString instanceof Date) {
          // Convert to UTC date string (YYYY-MM-DD) to prevent timezone shift
          const year = dateString.getUTCFullYear();
          const month = String(dateString.getUTCMonth() + 1).padStart(2, '0');
          const day = String(dateString.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // If it's already a YYYY-MM-DD string, use it directly
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        
        // If it's a string with time component, extract date part
        if (typeof dateString === 'string' && dateString.includes('T')) {
          return dateString.split('T')[0];
        }
        
        // If it's a Date object or timestamp, convert carefully
        try {
          const date = new Date(dateString);
          // Use UTC to avoid timezone issues
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Error converting date:', dateString, error);
          return null;
        }
      }).filter(date => date !== null);
      
      const { currentStreak: streak } = calculateStreak(completedDates, habit.frequency, habit.frequency_count);
      
      const isCompletedToday = completedDates.includes(today);
      
      console.log(`📅 Habit "${habit.name}": ${completedDates.length} completions, completed today: ${isCompletedToday}, streak: ${streak}`);
      
      return {
        ...habit,
        // Convert database column names to camelCase for frontend
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
        userId: habit.user_id,
        // Remove the original snake_case properties
        created_at: undefined,
        updated_at: undefined,
        user_id: undefined,
        completedDates,
        streak,
        frequencyCount: habit.frequency_count || 1
      };
    }));

    console.log(`✅ Returning ${habitsWithStreaks.length} fresh habits from database`);
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
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'interval', 'flexible_weekly']),
  body('frequency_count').optional().isInt({ min: 1 }),
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

    const { name, category, frequency, frequency_count, notes, target, unit, color, icon } = req.body;
    const habitId = uuidv4();

    await getDatabase().run(
      `INSERT INTO habits (
        id, user_id, name, category, frequency, frequency_count, notes, target, unit, color, icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [habitId, req.user.id, name, category, frequency, frequency_count || 1, notes || null, target || 1, unit || null, color || null, icon || null]
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
    const { date, notes, mood, value } = req.body || {};
    
    // Always use today's date as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const completionDate = date || today;
    
    console.log(`📅 Completion date: ${completionDate}`);

    // Check if habit belongs to user
    const habit = await getDatabase().get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
    console.log('🔍 Found habit:', habit ? 'Yes' : 'No');

    if (!habit) {
      console.log('❌ Habit not found for user');
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if already completed for this date
    const existingCompletion = await getDatabase().get(
      `SELECT * FROM habit_completions 
       WHERE habit_id = ? AND date = ?`,
      [id, completionDate]
    );

    console.log('🔍 Checking completion for date:', completionDate);
    console.log('🔍 Existing completion found:', existingCompletion ? 'Yes' : 'No');

    if (existingCompletion) {
      // Remove completion (uncomplete)
      await getDatabase().run(
        'DELETE FROM habit_completions WHERE id = ?',
        [existingCompletion.id]
      );

      // Deduct XP if this was the only completion for this habit today
      const remainingCompletions = await getDatabase().get(`
        SELECT COUNT(*) as count 
        FROM habit_completions hc 
        JOIN habits h ON hc.habit_id = h.id 
        WHERE h.user_id = ? AND h.name = ? AND hc.date = ?
      `, [req.user.id, habit.name, completionDate]);

      if (remainingCompletions.count === 0) {
        // Deduct XP since this was the last completion for this habit today
        await getDatabase().run(
          'UPDATE users SET xp = GREATEST(0, xp - ?) WHERE id = ?',
          [10, req.user.id]
        );
        console.log(`💸 Deducted 10 XP for uncompleting "${habit.name}"`);
      }

      console.log('🗑️ Habit uncompleted');
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

      // Award XP (only once per day per habit name)
      const todayXPCheck = await getDatabase().get(`
        SELECT COUNT(*) as count 
        FROM habit_completions hc 
        JOIN habits h ON hc.habit_id = h.id 
        WHERE h.user_id = ? AND h.name = ? AND hc.date = ?
      `, [req.user.id, habit.name, completionDate]);
      
      let xpGain = 0;
      if (todayXPCheck.count <= 1) { // <= 1 because we just added one
        xpGain = 10;
        await getDatabase().run(
          'UPDATE users SET xp = xp + ? WHERE id = ?',
          [xpGain, req.user.id]
        );
        console.log(`💎 Gained ${xpGain} XP for completing "${habit.name}"`);
      } else {
        console.log(`⚠️ No XP gained - already completed "${habit.name}" today`);
      }

      // Auto-complete duplicate habits with same name
      const duplicateHabits = await getDatabase().all(`
        SELECT id FROM habits 
        WHERE user_id = ? AND name = ? AND id != ?
      `, [req.user.id, habit.name, id]);
      
      let duplicatesSynced = 0;
      for (const dupHabit of duplicateHabits) {
        const dupExisting = await getDatabase().get(
          'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
          [dupHabit.id, completionDate]
        );
        
        if (!dupExisting) {
          await getDatabase().run(
            `INSERT INTO habit_completions (
              id, habit_id, user_id, date, value, notes, mood
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), dupHabit.id, req.user.id, completionDate, value || 1, notes || null, mood || null]
          );
          duplicatesSynced++;
        }
      }

      console.log(`✅ Habit completed. Duplicates synced: ${duplicatesSynced}`);
      res.json({ 
        message: 'Habit marked as completed', 
        completed: true, 
        xpGained: xpGain,
        duplicatesSynced: duplicatesSynced 
      });
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


module.exports = router;
