const sqlite3 = require('sqlite3').verbose();
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
            bio TEXT,
            avatar_color VARCHAR(7) DEFAULT '#3b82f6',
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            share_progress BOOLEAN DEFAULT true,
            public_profile BOOLEAN DEFAULT false,
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
            creator_id UUID NOT NULL,
            privacy VARCHAR(20) DEFAULT 'public',
            habit_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE SET NULL
          )
        `,
        group_members: `
          CREATE TABLE IF NOT EXISTS group_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id UUID NOT NULL,
            user_id UUID NOT NULL,
            role VARCHAR(20) DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(group_id, user_id)
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
            bio TEXT,
            avatar_color TEXT DEFAULT '#3b82f6',
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            share_progress BOOLEAN DEFAULT true,
            public_profile BOOLEAN DEFAULT false,
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
            creator_id TEXT NOT NULL,
            privacy TEXT DEFAULT 'public',
            habit_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE SET NULL
          )
        `,
        group_members: `
          CREATE TABLE IF NOT EXISTS group_members (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(group_id, user_id)
          )
        `
      };
    }
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

    console.log('Database initialized successfully');
    return dbService;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = { DatabaseService, initDatabase };
