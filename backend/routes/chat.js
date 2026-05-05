/**
 * Chat Route
 * POST /api/chat — Receives a user message, forwards it to the Ollama LLM,
 * and returns Sprout's reply along with the difficulty score.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { chatWithSprout } = require('../services/ollamaService');

/**
 * POST /api/chat
 * Body: { message: string }
 * Response: { reply: string, difficulty_score: number }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A non-empty "message" field is required.' });
    }

    console.log(`[ChatRoute] User ${req.user.id} sent: "${message.substring(0, 100)}..."`);

    const result = await chatWithSprout(message.trim());

    console.log(`[ChatRoute] Sprout replied with difficulty_score: ${result.difficulty_score}`);

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

module.exports = router;
