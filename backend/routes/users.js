const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:id', authenticateToken, (req, res) => {
  res.json({ message: 'User profile endpoint - Coming soon' });
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Update profile endpoint - Coming soon' });
});

module.exports = router;
