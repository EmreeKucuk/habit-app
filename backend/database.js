// Legacy database.js - now using new DatabaseService
// This file is kept for compatibility but will use the new service

const { DatabaseService, initDatabase } = require('./services/databaseService');

// Create a single database instance
let dbInstance = null;

const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
};

// Export for compatibility with existing code
module.exports = {
  initDatabase,
  getDatabase,
  // Legacy exports (will be deprecated)
  db: getDatabase()
};

      // Habit completions table
      db.run(`
        CREATE TABLE IF NOT EXISTS habit_completions (
          id TEXT PRIMARY KEY,
          habit_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          completed_date DATE NOT NULL,
          value INTEGER DEFAULT 1,
          notes TEXT,
          mood TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(habit_id, completed_date)
        )
      `);

      // Friends table
      db.run(`
        CREATE TABLE IF NOT EXISTS friends (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          friend_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          accepted_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, friend_id)
        )
      `);

      // Groups table
      db.run(`
        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          habit_id TEXT,
          privacy TEXT DEFAULT 'public',
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE SET NULL
        )
      `);

      // Group members table
      db.run(`
        CREATE TABLE IF NOT EXISTS group_members (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(group_id, user_id)
        )
      `);

      // Badges table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          badge_id TEXT NOT NULL,
          earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, badge_id)
        )
      `);

      // Comments table
      db.run(`
        CREATE TABLE IF NOT EXISTS habit_comments (
          id TEXT PRIMARY KEY,
          habit_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          completion_id TEXT,
          comment_text TEXT NOT NULL,
          mood TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (completion_id) REFERENCES habit_completions (id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON habit_completions(habit_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(completed_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)`);
      
      console.log('Database initialized successfully');
      resolve();
    });
  });
};

module.exports = { db, initDatabase };
