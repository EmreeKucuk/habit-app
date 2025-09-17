const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get groups
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Groups endpoint - Coming soon' });
});

// Create group
router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Create group endpoint - Coming soon' });
});

module.exports = router;
