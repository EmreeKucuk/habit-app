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

// Reset password page (HTML form for email link)
router.get('/reset-password-page', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send(`
      <html><body style="background:#FEFAE0; font-family:sans-serif; text-align:center; padding:50px;">
      <h1 style="color:#344E41;">Invalid Link</h1>
      <p style="color:#344E41;">This reset link is invalid or missing a token.</p>
      </body></html>
    `);
  }

  // Verify token is still valid before showing the form
  const user = await getDb().get(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?',
    [token, new Date().toISOString()]
  );

  if (!user) {
    return res.status(400).send(`
      <html><body style="background:#FEFAE0; font-family:sans-serif; text-align:center; padding:50px;">
      <h1 style="color:#344E41;">Link Expired</h1>
      <p style="color:#344E41;">This password reset link has expired. Please request a new one from the app.</p>
      </body></html>
    `);
  }

  const backendUrl = process.env.BACKEND_URL || 'https://habit-app-backend-nfhj.onrender.com';

  res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { background-color: #FEFAE0; font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background-color: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 100%; }
        .icon { font-size: 50px; margin-bottom: 16px; }
        h1 { color: #344E41; margin-top: 0; font-size: 24px; }
        p { color: #666; line-height: 1.5; margin-bottom: 24px; font-size: 14px; }
        label { display: block; text-align: left; color: #344E41; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
        input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 16px; box-sizing: border-box; margin-bottom: 16px; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: #E9C46A; }
        .btn { background-color: #E9C46A; color: #344E41; border: none; padding: 14px 30px; border-radius: 30px; font-weight: bold; font-size: 16px; cursor: pointer; width: 100%; box-shadow: 0 4px 6px rgba(233,196,106,0.3); transition: opacity 0.2s; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn:hover:not(:disabled) { opacity: 0.9; }
        .error { color: #D64545; font-size: 13px; margin-bottom: 12px; display: none; text-align: left; }
        .success { color: #4CAF50; }
        .hint { color: #999; font-size: 12px; text-align: left; margin-top: -10px; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="card" id="formCard">
        <div class="icon">🔐</div>
        <h1>Reset Your Password</h1>
        <p>Enter your new password below.</p>
        <form id="resetForm" onsubmit="handleSubmit(event)">
          <label for="password">New Password</label>
          <input type="password" id="password" placeholder="Enter new password" required minlength="6" />
          <p class="hint">Must contain uppercase, lowercase, and a number (min 6 chars)</p>

          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" placeholder="Confirm new password" required />

          <p class="error" id="errorMsg"></p>
          <button type="submit" class="btn" id="submitBtn">Reset Password</button>
        </form>
      </div>

      <script>
        async function handleSubmit(e) {
          e.preventDefault();
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const errorMsg = document.getElementById('errorMsg');
          const submitBtn = document.getElementById('submitBtn');

          errorMsg.style.display = 'none';

          if (password !== confirmPassword) {
            errorMsg.textContent = 'Passwords do not match.';
            errorMsg.style.display = 'block';
            return;
          }

          if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(password)) {
            errorMsg.textContent = 'Password must contain uppercase, lowercase, and a number.';
            errorMsg.style.display = 'block';
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Resetting...';

          try {
            const res = await fetch('${backendUrl}/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: '${token}', password, confirmPassword })
            });
            const data = await res.json();

            if (res.ok) {
              document.getElementById('formCard').innerHTML = '<div class="icon">✅</div><h1 class="success">Password Reset!</h1><p>Your password has been successfully changed. You can now return to the app and log in with your new password.</p>';
            } else {
              errorMsg.textContent = data.message || 'Failed to reset password. The link may have expired.';
              errorMsg.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
            }
          } catch (err) {
            errorMsg.textContent = 'Network error. Please try again.';
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
          }
        }
      </script>
    </body>
    </html>
  `);
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

// Google OAuth callback — serves a minimal page that the mobile WebBrowser intercepts
router.get('/google-callback', (req, res) => {
  // The access_token is in the URL fragment (#access_token=...) which
  // doesn't reach the server. This page simply redirects back so that
  // expo-web-browser's openAuthSessionAsync can capture the full URL.
  res.send(`
    <html>
    <head><title>Redirecting...</title></head>
    <body>
      <p>Signing you in...</p>
      <script>
        // The token is in the hash fragment — just let the page load
        // so the browser redirect is captured by the app
      </script>
    </body>
    </html>
  `);
});

// Google OAuth — accept an ID token from the mobile app
router.post('/google-auth', async (req, res) => {
  try {
    const { idToken, email, name, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Missing required Google auth data' });
    }

    // Check if user already exists with this email
    let user = await getDb().get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (user) {
      // User exists — just log them in
      if (!user.email_verified) {
        await getDb().run(
          'UPDATE users SET email_verified = true WHERE id = ?',
          [user.id]
        );
      }
    } else {
      // Create a new user from Google data
      const userId = uuidv4();
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20);
      // Generate a random password hash (user won't use it — they log in via Google)
      const randomPass = uuidv4();
      const passwordHash = await bcrypt.hash(randomPass, 12);

      const firstName = name ? name.split(' ')[0] : '';
      const lastName = name ? name.split(' ').slice(1).join(' ') : '';

      await getDb().run(
        `INSERT INTO users (
          id, username, email, password_hash, email_verified,
          first_name, last_name, avatar_color, xp, level, share_progress, public_profile
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, username, email, passwordHash, true,
          firstName, lastName, '#3b82f6', 0, 1, true, false
        ]
      );

      user = await getDb().get('SELECT * FROM users WHERE id = ?', [userId]);
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    const { password_hash, verification_token, reset_token, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      user: safeUser,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Apple OAuth — accept Apple identity data from the mobile app
router.post('/apple-auth', async (req, res) => {
  try {
    const { identityToken, email, fullName, appleUserId } = req.body;

    if (!appleUserId) {
      return res.status(400).json({ message: 'Missing Apple user ID' });
    }

    // Apple only provides email/name on the FIRST sign-in, so we use appleUserId as the key
    let user = null;

    // First try to find by email (if provided)
    if (email) {
      user = await getDb().get('SELECT * FROM users WHERE email = ?', [email]);
    }

    if (user) {
      if (!user.email_verified) {
        await getDb().run('UPDATE users SET email_verified = true WHERE id = ?', [user.id]);
      }
    } else {
      // Create new user
      const userId = uuidv4();
      const userEmail = email || `apple_${appleUserId.substring(0, 8)}@privaterelay.appleid.com`;
      const username = userEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20);
      const randomPass = uuidv4();
      const passwordHash = await bcrypt.hash(randomPass, 12);

      const firstName = fullName?.givenName || '';
      const lastName = fullName?.familyName || '';

      await getDb().run(
        `INSERT INTO users (
          id, username, email, password_hash, email_verified,
          first_name, last_name, avatar_color, xp, level, share_progress, public_profile
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, username, userEmail, passwordHash, true,
          firstName, lastName, '#3b82f6', 0, 1, true, false
        ]
      );

      user = await getDb().get('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    const { password_hash, verification_token, reset_token, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      user: safeUser,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
