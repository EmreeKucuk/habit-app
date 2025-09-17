const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./database');

async function createTestUser() {
  try {
    const db = getDatabase();
    
    // Check if test user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: password123');
      return;
    }
    
    // Create test user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.run(`
      INSERT INTO users (
        id, username, email, password_hash, email_verified, avatar_color, xp, level, 
        share_progress, public_profile, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      'testuser',
      'test@example.com',
      hashedPassword,
      true, // email_verified
      '#3B82F6', // avatar_color
      0, // xp
      1, // level
      false, // share_progress
      false, // public_profile
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 Username: testuser');
    console.log('🆔 User ID:', userId);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createTestUser().then(() => process.exit(0));
}

module.exports = { createTestUser };