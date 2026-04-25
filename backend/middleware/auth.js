const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    try {
      // Verify user still exists in database
      const dbUser = await getDatabase().get('SELECT id, username, email FROM users WHERE id = ?', [user.id]);
      
      if (!dbUser) {
        return res.status(403).json({ message: 'User not found' });
      }
      
      req.user = dbUser;
      next();
    } catch (error) {
      console.error('Auth middleware database error:', error);
      return res.status(500).json({ message: 'Database error' });
    }
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
