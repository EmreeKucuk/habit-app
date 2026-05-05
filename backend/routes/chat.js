/**
 * Chat Route
 * POST /api/chat — Receives a user message, forwards it to the Ollama LLM
 * with the user's active habits injected, and returns Sprout's reply along
 * with difficulty_score and completed_habit_id.
 * After a successful LLM response, triggers the Motivation Algorithm
 * in the background to update the user's motivation_score and motivation_mode.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database');
const { chatWithSprout } = require('../services/ollamaService');
const { calculateMotivationScore, applyMotivationMode } = require('../services/motivationScoreService');
const { completeHabit } = require('../services/habitCompletionService');

/**
 * Fetches the user's active (non-archived) habits that have NOT been completed today.
 * Returns a lightweight array with id, name, and category for LLM context injection.
 *
 * @param {string} userId
 * @returns {Promise<Array<{id: string, name: string, category: string}>>}
 */
async function getActiveHabitsForToday(userId) {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const habits = await db.all(
    `SELECT h.id, h.name, h.category
     FROM habits h
     WHERE h.user_id = ?
       AND COALESCE(h.is_archived, false) = false
       AND h.id NOT IN (
         SELECT hc.habit_id FROM habit_completions hc
         WHERE hc.user_id = ? AND hc.date = ?
       )`,
    [userId, userId, today]
  );

  console.log(`[ChatRoute] Found ${habits.length} pending habits for user ${userId} on ${today}`);
  return habits;
}

/**
 * POST /api/chat
 * Body: { message: string }
 * Response: { reply: string, difficulty_score: number, completed_habit_id: string|null }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A non-empty "message" field is required.' });
    }

    const userId = req.user.id;
    console.log(`[ChatRoute] User ${userId} sent: "${message.substring(0, 100)}..."`);

    // 1. Fetch the user's active habits for today (context for the LLM)
    const activeHabits = await getActiveHabitsForToday(userId);

    // 2. Get LLM response with habit context injected
    const result = await chatWithSprout(message.trim(), activeHabits);
    console.log(`[ChatRoute] Sprout replied — difficulty: ${result.difficulty_score}, completed_habit_id: ${result.completed_habit_id}`);

    // 3. Auto-complete habit if the LLM detected a completion
    let habitCompletion = null;
    if (result.completed_habit_id) {
      console.log(`[ChatRoute] LLM detected habit completion — triggering auto-complete for ${result.completed_habit_id}`);
      try {
        habitCompletion = await completeHabit(result.completed_habit_id, userId);
        console.log(`[ChatRoute] Auto-complete result:`, JSON.stringify(habitCompletion));
      } catch (err) {
        console.error('[ChatRoute] Auto-complete failed:', err.message);
      }
    }

    // 4. Trigger Motivation Algorithm in the background (fire-and-forget)
    triggerMotivationUpdate(userId, result.difficulty_score)
      .then((motivation) => {
        console.log(`[ChatRoute] Motivation update complete: score=${motivation.score}, mode=${motivation.mode}`);
      })
      .catch((err) => {
        console.error('[ChatRoute] Motivation update failed (non-blocking):', err.message);
      });

    return res.json({
      reply: result.reply,
      difficulty_score: result.difficulty_score,
      completed_habit_id: result.completed_habit_id,
      habit_completion: habitCompletion,
    });
  } catch (error) {
    console.error('[ChatRoute] Error processing chat:', error.message);

    // If the LLM is unreachable, return a graceful fallback
    return res.status(503).json({
      message: 'Sprout is currently unavailable. Please try again in a moment.',
      reply: "I'm having a little trouble connecting right now, but I believe in you! 🌱",
      difficulty_score: 3,
      completed_habit_id: null,
    });
  }
});

/**
 * Runs the full motivation pipeline:
 *   1. Calculate the motivation score using the 3-component formula.
 *   2. Persist score + mode to the users table.
 *   3. Return the applied actions (High/Medium/Recovery).
 */
async function triggerMotivationUpdate(userId, difficultyScore) {
  const { score, mode, breakdown } = await calculateMotivationScore(userId, difficultyScore);
  const result = await applyMotivationMode(userId, score, mode);
  console.log(`[ChatRoute] Motivation breakdown:`, JSON.stringify(breakdown));
  return result;
}

module.exports = router;
