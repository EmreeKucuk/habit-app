/**
 * Chat Route
 * POST /api/chat — Receives a user message, forwards it to the Ollama LLM,
 * and returns Sprout's reply along with the difficulty score.
 * After a successful LLM response, triggers the Motivation Algorithm
 * in the background to update the user's motivation_score and motivation_mode.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { chatWithSprout } = require('../services/ollamaService');
const { calculateMotivationScore, applyMotivationMode } = require('../services/motivationScoreService');

/**
 * POST /api/chat
 * Body: { message: string }
 * Response: { reply: string, difficulty_score: number, motivation: { score, mode, actions } }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A non-empty "message" field is required.' });
    }

    const userId = req.user.id;
    console.log(`[ChatRoute] User ${userId} sent: "${message.substring(0, 100)}..."`);

    // 1. Get LLM response
    const result = await chatWithSprout(message.trim());
    console.log(`[ChatRoute] Sprout replied with difficulty_score: ${result.difficulty_score}`);

    // 2. Trigger Motivation Algorithm in the background (fire-and-forget)
    //    This runs asynchronously — it does NOT block the chat response.
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
    });
  } catch (error) {
    console.error('[ChatRoute] Error processing chat:', error.message);

    // If the LLM is unreachable, return a graceful fallback
    return res.status(503).json({
      message: 'Sprout is currently unavailable. Please try again in a moment.',
      reply: "I'm having a little trouble connecting right now, but I believe in you! 🌱",
      difficulty_score: 3,
    });
  }
});

/**
 * Runs the full motivation pipeline:
 *   1. Calculate the motivation score using the 3-component formula.
 *   2. Persist score + mode to the users table.
 *   3. Return the applied actions (High/Medium/Recovery).
 *
 * @param {string} userId
 * @param {number} difficultyScore - The LLM's difficulty_score (1-5).
 * @returns {Promise<{score: number, mode: string, actions: object}>}
 */
async function triggerMotivationUpdate(userId, difficultyScore) {
  // Calculate score and determine mode
  const { score, mode, breakdown } = await calculateMotivationScore(userId, difficultyScore);

  // Persist to DB and get action rules
  const result = await applyMotivationMode(userId, score, mode);

  console.log(`[ChatRoute] Motivation breakdown:`, JSON.stringify(breakdown));

  return result;
}

module.exports = router;
