/**
 * Motivation Routes — Scoring algorithm & chat logging endpoints.
 * 
 * Motivation Score Algorithm:
 *   - Streak Factor (0-30):    Based on current streak length
 *   - Consistency Factor (0-25): Based on completion rate over last 14 days  
 *   - Difficulty Factor (0-25):  Based on average difficulty ratings (higher difficulty + completion = more motivation)
 *   - Recency Factor (0-20):    Based on how recently the user logged a habit
 *   
 *   Total Score: 0-100
 *   Thresholds: 0-30 = low, 31-60 = medium, 61-100 = high
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');

const router = express.Router();

// ─── POST /api/motivation/log ──────────────────────────────────
// Log a difficulty rating + mood from the chat interface
router.post('/log', authenticateToken, [
  body('habitCategory').optional().isString(),
  body('difficultyRating').optional().isInt({ min: 1, max: 5 }),
  body('mood').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { habitCategory, difficultyRating, mood } = req.body;

    const db = getDatabase();
    const id = uuidv4();

    await db.run(
      `INSERT INTO motivation_logs (id, user_id, habit_category, difficulty_rating, mood, logged_via)
       VALUES (?, ?, ?, ?, ?, 'chat')`,
      [id, userId, habitCategory || null, difficultyRating || null, mood || null]
    );

    res.status(201).json({
      message: 'Motivation log saved',
      id,
    });
  } catch (error) {
    console.error('Error logging motivation:', error);
    res.status(500).json({ message: 'Failed to save motivation log' });
  }
});

// ─── GET /api/motivation/score ─────────────────────────────────
// Calculate and return the user's current motivation score
router.get('/score', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    // 1. Streak Factor (0-30)
    const streakData = await calculateStreakFactor(db, userId);

    // 2. Consistency Factor (0-25)  
    const consistencyData = await calculateConsistencyFactor(db, userId);

    // 3. Difficulty Factor (0-25)
    const difficultyData = await calculateDifficultyFactor(db, userId);

    // 4. Recency Factor (0-20)
    const recencyData = await calculateRecencyFactor(db, userId);

    // Total score
    const totalScore = Math.min(100, Math.round(
      streakData.score + consistencyData.score + difficultyData.score + recencyData.score
    ));

    // Determine level
    let level = 'low';
    if (totalScore > 60) level = 'high';
    else if (totalScore > 30) level = 'medium';

    // Determine mascot tone
    let mascotTone = getMascotTone(level, totalScore);

    res.json({
      score: totalScore,
      level,
      mascotTone,
      breakdown: {
        streak: { score: streakData.score, max: 30, currentStreak: streakData.currentStreak },
        consistency: { score: consistencyData.score, max: 25, rate: consistencyData.rate },
        difficulty: { score: difficultyData.score, max: 25, avgDifficulty: difficultyData.avg },
        recency: { score: recencyData.score, max: 20, daysSinceLastLog: recencyData.daysSince },
      },
    });
  } catch (error) {
    console.error('Error calculating motivation score:', error);
    res.status(500).json({ message: 'Failed to calculate motivation score' });
  }
});

// ─── POST /api/motivation/chat ─────────────────────────────────
// Save a chat message (for history persistence)
router.post('/chat', authenticateToken, [
  body('sender').isIn(['user', 'mascot']),
  body('message').isString().isLength({ min: 1 }),
  body('habitCategory').optional().isString(),
  body('difficultyRating').optional().isInt({ min: 1, max: 5 }),
  body('mood').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { sender, message, habitCategory, difficultyRating, mood } = req.body;
    const db = getDatabase();
    const id = uuidv4();

    await db.run(
      `INSERT INTO chat_messages (id, user_id, sender, message, habit_category, difficulty_rating, mood)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, sender, message, habitCategory || null, difficultyRating || null, mood || null]
    );

    res.status(201).json({ message: 'Chat message saved', id });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ message: 'Failed to save chat message' });
  }
});

// ─── GET /api/motivation/chat/history ──────────────────────────
// Get chat history for the current user
router.get('/chat/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const db = getDatabase();

    const messages = await db.all(
      `SELECT id, sender, message, habit_category, difficulty_rating, mood, created_at
       FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// ─── GET /api/motivation/insights ──────────────────────────────
// Get motivation insights and trends
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    // Average difficulty over last 7 days
    const recentDifficulty = await db.get(
      `SELECT AVG(difficulty_rating) as avg_difficulty, COUNT(*) as total_logs
       FROM motivation_logs
       WHERE user_id = ? AND difficulty_rating IS NOT NULL
       AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`,
      [userId]
    );

    // Mood distribution
    const moodDist = await db.all(
      `SELECT mood, COUNT(*) as count
       FROM motivation_logs
       WHERE user_id = ? AND mood IS NOT NULL
       AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
       GROUP BY mood
       ORDER BY count DESC`,
      [userId]
    );

    // Most logged habit categories
    const topCategories = await db.all(
      `SELECT habit_category, COUNT(*) as count, AVG(difficulty_rating) as avg_difficulty
       FROM motivation_logs
       WHERE user_id = ? AND habit_category IS NOT NULL
       AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
       GROUP BY habit_category
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );

    // Daily motivation trend (last 14 days)
    const dailyTrend = await db.all(
      `SELECT DATE(created_at) as date, 
              AVG(difficulty_rating) as avg_difficulty,
              COUNT(*) as log_count
       FROM motivation_logs
       WHERE user_id = ?
       AND created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );

    res.json({
      recentAvgDifficulty: recentDifficulty?.avg_difficulty || null,
      totalRecentLogs: recentDifficulty?.total_logs || 0,
      moodDistribution: moodDist,
      topCategories,
      dailyTrend,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: 'Failed to fetch motivation insights' });
  }
});

// ─── Scoring Helper Functions ───────────────────────────────────

async function calculateStreakFactor(db, userId) {
  // Get all unique completion dates
  const completions = await db.all(
    `SELECT DISTINCT date FROM habit_completions
     WHERE user_id = ?
     ORDER BY date DESC`,
    [userId]
  );

  let currentStreak = 0;
  if (completions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(today);
    
    for (const row of completions) {
      const compDate = new Date(row.date);
      compDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.round((checkDate - compDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreak++;
        checkDate = new Date(compDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Score: 0-30, logarithmic scaling (diminishing returns after 14 days)
  const score = Math.min(30, Math.round(30 * Math.log(currentStreak + 1) / Math.log(15)));

  return { score, currentStreak };
}

async function calculateConsistencyFactor(db, userId) {
  // How many of the last 14 days had at least one completion?
  const result = await db.get(
    `SELECT COUNT(DISTINCT date) as active_days
     FROM habit_completions
     WHERE user_id = ?
     AND date >= CURRENT_DATE - INTERVAL '14 days'`,
    [userId]
  );

  const activeDays = result?.active_days || 0;
  const rate = activeDays / 14;

  // Score: 0-25, linear
  const score = Math.round(25 * rate);

  return { score, rate: Math.round(rate * 100) };
}

async function calculateDifficultyFactor(db, userId) {
  // Average difficulty from recent motivation logs
  // Higher difficulty + still completing = MORE motivated
  const result = await db.get(
    `SELECT AVG(difficulty_rating) as avg_diff, COUNT(*) as count
     FROM motivation_logs
     WHERE user_id = ?
     AND difficulty_rating IS NOT NULL
     AND created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'`,
    [userId]
  );

  const avg = result?.avg_diff || 0;
  const count = result?.count || 0;

  // Score: Combination of having ratings (engagement) + high difficulty (pushing themselves)
  // engagement: up to 15 points for logging regularly
  // difficulty bonus: up to 10 points for higher difficulty
  const engagement = Math.min(15, count * 2);
  const difficultyBonus = avg > 0 ? Math.round(10 * (avg / 5)) : 0;
  const score = Math.min(25, engagement + difficultyBonus);

  return { score, avg: Math.round(avg * 10) / 10 };
}

async function calculateRecencyFactor(db, userId) {
  // How recently did the user log anything?
  const result = await db.get(
    `SELECT MAX(date) as last_date
     FROM habit_completions
     WHERE user_id = ?`,
    [userId]
  );

  let daysSince = 999;
  if (result?.last_date) {
    const lastDate = new Date(result.last_date);
    const today = new Date();
    daysSince = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
  }

  // Score: 20 for today, decreasing by 3 per day, min 0
  const score = Math.max(0, 20 - daysSince * 3);

  return { score, daysSince };
}

function getMascotTone(level, score) {
  if (level === 'high') {
    return {
      greeting: "You're on fire! 🔥",
      encouragement: "Keep crushing it, champion!",
      style: 'energetic',
    };
  } else if (level === 'medium') {
    return {
      greeting: "Hey, good to see you! 😊",
      encouragement: "You're making progress — let's keep going!",
      style: 'supportive',
    };
  } else {
    return {
      greeting: "Hey, I missed you! 🌱",
      encouragement: "Every small step counts. I believe in you! 💚",
      style: 'gentle',
    };
  }
}

module.exports = router;
