const jwt = require('jsonwebtoken');
const { db } = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // Verify user still exists in database
    db.get('SELECT id, username, email FROM users WHERE id = ?', [user.id], (err, dbUser) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (!dbUser) {
        return res.status(403).json({ message: 'User not found' });
      }
      
      req.user = dbUser;
      next();
    });
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

module.exports = { authenticateToken, optionalAuth };
