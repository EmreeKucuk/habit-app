let sqlite3;
if (process.env.DATABASE_TYPE !== 'postgresql') {
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (e) {
    console.warn('sqlite3 not available, ensure you are using PostgreSQL');
  }
}
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbType = process.env.DATABASE_TYPE || 'sqlite';
    this.initializeDatabase();
  }

  // Convert SQLite-style queries to PostgreSQL format
  convertSqlToPostgreSQL(sql) {
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  }

  initializeDatabase() {
    if (this.dbType === 'postgresql') {
      // PostgreSQL configuration
      const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
      
      this.db = new Pool({
        connectionString,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });
      
      console.log('Using PostgreSQL database');
    } else {
      // SQLite configuration (default)
      const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'habit_tracker.db');
      this.db = new sqlite3.Database(dbPath);
      console.log('Using SQLite database');
    }
  }

  async query(sql, params = []) {
    if (this.dbType === 'postgresql') {
      try {
        const result = await this.db.query(sql, params);
        return result.rows;
      } catch (error) {
        console.error('PostgreSQL query error:', error);
        throw error;
      }
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            console.error('SQLite query error:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.dbType === 'postgresql') {
      try {
        const convertedSql = this.convertSqlToPostgreSQL(sql);
        const result = await this.db.query(convertedSql, params);
        return { lastID: result.insertId, changes: result.rowCount };
      } catch (error) {
        console.error('PostgreSQL run error:', error);
        throw error;
      }
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) {
            console.error('SQLite run error:', err);
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    }
  }

  async get(sql, params = []) {
    if (this.dbType === 'postgresql') {
      try {
        const convertedSql = this.convertSqlToPostgreSQL(sql);
        const result = await this.db.query(convertedSql + ' LIMIT 1', params);
        return result.rows[0] || null;
      } catch (error) {
        console.error('PostgreSQL get error:', error);
        throw error;
      }
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) {
            console.error('SQLite get error:', err);
            reject(err);
          } else {
            resolve(row || null);
          }
        });
      });
    }
  }

  async all(sql, params = []) {
    if (this.dbType === 'postgresql') {
      try {
        const convertedSql = this.convertSqlToPostgreSQL(sql);
        const result = await this.db.query(convertedSql, params);
        return result.rows || [];
      } catch (error) {
        console.error('PostgreSQL all error:', error);
        throw error;
      }
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            console.error('SQLite all error:', err);
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      });
    }
  }

  getCreateTableSQL() {
    if (this.dbType === 'postgresql') {
      return {
        users: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            age INTEGER,
            bio TEXT,
            avatar_color VARCHAR(7) DEFAULT '#3b82f6',
            avatar_icon VARCHAR(50),
            profile_photo TEXT,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            share_progress BOOLEAN DEFAULT true,
            public_profile BOOLEAN DEFAULT false,
            privacy_level VARCHAR(20) DEFAULT 'public',
            email_verified BOOLEAN DEFAULT false,
            verification_token VARCHAR(255),
            reset_token VARCHAR(255),
            reset_token_expires TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
        habits: `
          CREATE TABLE IF NOT EXISTS habits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL,
            frequency VARCHAR(20) NOT NULL,
            notes TEXT,
            target INTEGER DEFAULT 1,
            unit VARCHAR(20),
            color VARCHAR(7),
            icon VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `,
        habit_completions: `
          CREATE TABLE IF NOT EXISTS habit_completions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            habit_id UUID NOT NULL,
            user_id UUID NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            value INTEGER DEFAULT 1,
            notes TEXT,
            mood VARCHAR(20),
            date DATE NOT NULL,
            FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(habit_id, date)
          )
        `,
        friends: `
          CREATE TABLE IF NOT EXISTS friends (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            friend_id UUID NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, friend_id)
          )
        `,
        groups: `
          CREATE TABLE IF NOT EXISTS groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            habit_name VARCHAR(255) NOT NULL,
            habit_category VARCHAR(50) NOT NULL,
            creator_id UUID NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            target_frequency INTEGER NOT NULL DEFAULT 7,
            is_public BOOLEAN DEFAULT true,
            status VARCHAR(20) DEFAULT 'upcoming',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `,
        group_members: `
          CREATE TABLE IF NOT EXISTS group_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id UUID NOT NULL,
            user_id UUID NOT NULL,
            role VARCHAR(20) DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_completions INTEGER DEFAULT 0,
            completion_rate DECIMAL(5,2) DEFAULT 0.00,
            current_streak INTEGER DEFAULT 0,
            last_completion_date DATE,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(group_id, user_id)
          )
        `,
        group_completions: `
          CREATE TABLE IF NOT EXISTS group_completions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id UUID NOT NULL,
            user_id UUID NOT NULL,
            completion_date DATE NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(group_id, user_id, completion_date)
          )
        `
      };
    } else {
      // SQLite SQL
      return {
        users: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            age INTEGER,
            bio TEXT,
            avatar_color TEXT DEFAULT '#3b82f6',
            avatar_icon TEXT,
            profile_photo TEXT,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            share_progress BOOLEAN DEFAULT true,
            public_profile BOOLEAN DEFAULT false,
            privacy_level TEXT DEFAULT 'public',
            email_verified BOOLEAN DEFAULT false,
            verification_token TEXT,
            reset_token TEXT,
            reset_token_expires DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
        habits: `
          CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            frequency TEXT NOT NULL,
            notes TEXT,
            target INTEGER DEFAULT 1,
            unit TEXT,
            color TEXT,
            icon TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `,
        habit_completions: `
          CREATE TABLE IF NOT EXISTS habit_completions (
            id TEXT PRIMARY KEY,
            habit_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            value INTEGER DEFAULT 1,
            notes TEXT,
            mood TEXT,
            date DATE NOT NULL,
            FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(habit_id, date)
          )
        `,
        friends: `
          CREATE TABLE IF NOT EXISTS friends (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            friend_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, friend_id)
          )
        `,
        groups: `
          CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            habit_name TEXT NOT NULL,
            habit_category TEXT NOT NULL,
            creator_id TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            target_frequency INTEGER NOT NULL DEFAULT 7,
            is_public BOOLEAN DEFAULT true,
            status TEXT DEFAULT 'upcoming',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `,
        group_members: `
          CREATE TABLE IF NOT EXISTS group_members (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_completions INTEGER DEFAULT 0,
            completion_rate REAL DEFAULT 0.00,
            current_streak INTEGER DEFAULT 0,
            last_completion_date DATE,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(group_id, user_id)
          )
        `,
        group_completions: `
          CREATE TABLE IF NOT EXISTS group_completions (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            completion_date DATE NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(group_id, user_id, completion_date)
          )
        `
      };
    }
  }

  async addColumnIfNotExists(tableName, columnName, columnDefinition) {
    try {
      if (this.dbType === 'postgresql') {
        await this.run(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition}`);
      } else {
        // SQLite doesn't support IF NOT EXISTS for columns, so we need to check first
        const tableInfo = await this.query(`PRAGMA table_info(${tableName})`);
        const columnExists = tableInfo.some(col => col.name === columnName);
        
        if (!columnExists) {
          await this.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
        }
      }
    } catch (error) {
      // Column might already exist, which is fine
      console.log(`Column ${columnName} might already exist in ${tableName}:`, error.message);
    }
  }

  async migrateDatabase() {
    console.log('Running database migrations...');
    
    // Add new profile columns to users table
    await this.addColumnIfNotExists('users', 'first_name', this.dbType === 'postgresql' ? 'VARCHAR(100)' : 'TEXT');
    await this.addColumnIfNotExists('users', 'last_name', this.dbType === 'postgresql' ? 'VARCHAR(100)' : 'TEXT');
    await this.addColumnIfNotExists('users', 'age', 'INTEGER');
    await this.addColumnIfNotExists('users', 'avatar_icon', this.dbType === 'postgresql' ? 'VARCHAR(50)' : 'TEXT');
    await this.addColumnIfNotExists('users', 'profile_photo', 'TEXT');
    
    // Add privacy level column
    await this.addColumnIfNotExists('users', 'privacy_level', this.dbType === 'postgresql' ? "VARCHAR(20) DEFAULT 'public'" : "TEXT DEFAULT 'public'");
    
    console.log('✓ Database migrations completed');
  }

  async close() {
    if (this.dbType === 'postgresql') {
      await this.db.end();
    } else {
      this.db.close();
    }
  }
}

// Initialize database with tables
const initDatabase = async () => {
  const dbService = new DatabaseService();
  const tableSQL = dbService.getCreateTableSQL();

  try {
    console.log(`Initializing ${dbService.dbType} database...`);
    
    // Create tables
    for (const [tableName, sql] of Object.entries(tableSQL)) {
      await dbService.run(sql);
      console.log(`✓ Created table: ${tableName}`);
    }

    // Run migrations for existing databases
    await dbService.migrateDatabase();

    console.log('Database initialized successfully');
    return dbService;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = { DatabaseService, initDatabase };
