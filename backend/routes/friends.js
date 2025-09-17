const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get friends list
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Friends endpoint - Coming soon' });
});

// Send friend request
router.post('/request', authenticateToken, (req, res) => {
  res.json({ message: 'Friend request endpoint - Coming soon' });
});

module.exports = router;
