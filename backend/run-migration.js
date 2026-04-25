const { getDatabase } = require('./database');

async function runMigration() {
  try {
    console.log('Running privacy_level column migration...');
    
    const db = getDatabase();
    
    // Try to add privacy_level column
    try {
      await db.run('ALTER TABLE users ADD COLUMN privacy_level TEXT DEFAULT "public"');
      console.log('✅ Successfully added privacy_level column');
    } catch (error) {
      if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
        console.log('⚠️  privacy_level column already exists');
      } else {
        console.error('❌ Error adding privacy_level column:', error.message);
        throw error;
      }
    }
    
    // Update existing users to have public privacy by default
    try {
      const result = await db.run("UPDATE users SET privacy_level = 'public' WHERE privacy_level IS NULL");
      console.log(`✅ Updated ${result.changes || 0} users to have public privacy`);
    } catch (error) {
      console.error('❌ Error updating user privacy levels:', error.message);
    }
    
    // Verify the migration
    try {
      const users = await db.query('SELECT id, username, privacy_level FROM users LIMIT 5');
      console.log('✅ Migration verification - sample users:');
      users.forEach(user => {
        console.log(`   - ${user.username}: ${user.privacy_level || 'NULL'}`);
      });
    } catch (error) {
      console.error('❌ Error verifying migration:', error.message);
    }
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

runMigration();