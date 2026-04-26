const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const emailService = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get database instance
const getDb = () => getDatabase();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '30d' }
  );
};

// Register
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await getDb().get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = uuidv4();
    const userId = uuidv4();

    // Create user
    await getDb().run(
      `INSERT INTO users (
        id, username, email, password_hash, verification_token, 
        avatar_color, xp, level, share_progress, public_profile
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, username, email, passwordHash, verificationToken,
        '#3b82f6', 0, 1, true, false
      ]
    );

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, username, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('emailOrUsername').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { emailOrUsername, password } = req.body;

    // Check if input is email or username
    const isEmail = emailOrUsername.includes('@');
    
    // Find user by email or username
    const user = await getDb().get(
      isEmail 
        ? 'SELECT * FROM users WHERE email = ?'
        : 'SELECT * FROM users WHERE username = ?',
      [emailOrUsername]
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({ 
        message: 'Please verify your email address before logging in',
        emailNotVerified: true
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Remove sensitive data
    const { password_hash, verification_token, reset_token, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      user: safeUser,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify email (HTML page for email link)
router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).send(`
        <html><body>
        <h1 style="color:red; text-align:center; font-family:sans-serif; margin-top:50px;">Invalid or missing token</h1>
        </body></html>
      `);
    }

    const user = await getDb().get(
      'SELECT * FROM users WHERE verification_token = ?',
      [token]
    );

    if (!user) {
      return res.status(400).send(`
        <html><body style="background:#FEFAE0; font-family:sans-serif; text-align:center; padding:50px;">
        <h1 style="color:#344E41;">Invalid or Expired Link</h1>
        <p style="color:#344E41;">This verification link is invalid or has expired.</p>
        </body></html>
      `);
    }

    if (!user.email_verified) {
      await getDb().run(
        'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = ?',
        [user.id]
      );
    }

    res.send(`
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { background-color: #FEFAE0; font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background-color: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
          .icon { font-size: 60px; margin-bottom: 20px; }
          h1 { color: #344E41; margin-top: 0; }
          p { color: #666; line-height: 1.5; margin-bottom: 30px; }
          .button { background-color: #E9C46A; color: #344E41; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(233,196,106,0.3); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✨</div>
          <h1>Email Verified!</h1>
          <p>Your email has been successfully verified. You can now log into your HabitFlow account and start tracking your progress.</p>
          <a href="#" class="button" onclick="window.close(); return false;">Return to App</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Email verification GET error:', error);
    res.status(500).send('Internal server error');
  }
});

// Verify email (JSON API)
router.post('/verify-email', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const { token } = req.body;

    // Find user with verification token
    const user = await getDb().get(
      'SELECT * FROM users WHERE verification_token = ?',
      [token]
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Update user
    await getDb().run(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = ?',
      [user.id]
    );

    res.json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getDb().get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: 'If an account with that email exists, we will send a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await getDb().run(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetTokenExpires.toISOString(), user.id]
    );

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    res.json({ 
      message: 'If an account with that email exists, we will send a password reset link.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await getDb().get(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?',
      [token, new Date().toISOString()]
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await getDb().run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getDb().get(
      'SELECT id, username, email, first_name, last_name, age, bio, avatar_color, avatar_icon, profile_photo, xp, level, share_progress, public_profile, privacy_level, email_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty()
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
    );

    if (decoded.type !== 'refresh') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Get user
    const user = await getDb().get(
      'SELECT * FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;
