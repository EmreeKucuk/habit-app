/**
 * Migration: Add motivation_logs and chat_messages tables.
 * Run this once against the PostgreSQL database.
 * 
 * Usage: node run-motivation-migration.js
 */

const { getDatabase, initDatabase } = require('./database');

async function runMigration() {
  console.log('🧠 Running Motivation & Chat migration...\n');

  try {
    await initDatabase();
    const db = getDatabase();

    // ─── motivation_logs table ──────────────────────────────────
    console.log('Creating motivation_logs table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS motivation_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        habit_category VARCHAR(50),
        difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
        mood VARCHAR(30),
        logged_via VARCHAR(20) DEFAULT 'chat',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ motivation_logs table created');

    // ─── chat_messages table ────────────────────────────────────
    console.log('Creating chat_messages table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'mascot')),
        message TEXT NOT NULL,
        habit_category VARCHAR(50),
        difficulty_rating INTEGER,
        mood VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ chat_messages table created');

    // ─── Indexes ────────────────────────────────────────────────
    console.log('\nCreating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_motivation_user ON motivation_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_motivation_created ON motivation_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_motivation_category ON motivation_logs(habit_category)',
      'CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at)',
    ];

    for (const idx of indexes) {
      await db.run(idx);
    }
    console.log('✅ Indexes created');

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
