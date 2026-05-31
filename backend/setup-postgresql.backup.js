const { Client } = require('pg');
require('dotenv').config();

async function setupPostgreSQL() {
  console.log('🐘 Setting up PostgreSQL database for Habit Tracker...\n');

  // First, connect to PostgreSQL server (not to our specific database)
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    // Connect to PostgreSQL server
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists, create if it doesn't
    const dbExistsQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await adminClient.query(dbExistsQuery, [process.env.DB_NAME || 'habit_tracker']);

    if (dbExists.rows.length === 0) {
      console.log('📦 Creating database: habit_tracker');
      await adminClient.query(`CREATE DATABASE habit_tracker`);
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }

    await adminClient.end();

    // Now connect to our specific database
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'habit_tracker',
    });

    await dbClient.connect();
    console.log('✅ Connected to habit_tracker database');

    // Enable UUID extension
    console.log('🔧 Enabling UUID extension...');
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Create tables
    console.log('\n📋 Creating tables...');

    // Users table
    console.log('Creating users table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    `);
    console.log('✅ Users table created');

    // Habits table
    console.log('Creating habits table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    `);
    console.log('✅ Habits table created');

    // Habit completions table
    console.log('Creating habit_completions table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    `);
    console.log('✅ Habit completions table created');

    // Friends table
    console.log('Creating friends table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        friend_id UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
      )
    `);
    console.log('✅ Friends table created');

    // Groups table
    console.log('Creating groups table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        creator_id UUID NOT NULL,
        privacy VARCHAR(20) DEFAULT 'public',
        habit_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Groups table created');

    // Group members table
    console.log('Creating group_members table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id UUID NOT NULL,
        user_id UUID NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(group_id, user_id)
      )
    `);
    console.log('✅ Group members table created');

    // User badges table
    console.log('Creating user_badges table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        badge_id VARCHAR(50) NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, badge_id)
      )
    `);
    console.log('✅ User badges table created');

    // Habit comments table
    console.log('Creating habit_comments table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS habit_comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        habit_id UUID NOT NULL,
        user_id UUID NOT NULL,
        completion_id UUID,
        comment_text TEXT NOT NULL,
        mood VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (completion_id) REFERENCES habit_completions (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Habit comments table created');

    // Create indexes for better performance
    console.log('\n🔍 Creating indexes for optimal performance...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON habit_completions(habit_id)',
      'CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date)',
      'CREATE INDEX IF NOT EXISTS idx_completions_user_date ON habit_completions(user_id, date)',
      'CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status)',
      'CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)',
      'CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_badges_user_id ON user_badges(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_comments_habit_id ON habit_comments(habit_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)'
    ];

    for (const indexQuery of indexes) {
      await dbClient.query(indexQuery);
    }
    console.log('✅ All indexes created');

    // Create a trigger for updating updated_at timestamp
    console.log('\n⚡ Creating automatic timestamp triggers...');
    await dbClient.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await dbClient.query(`
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await dbClient.query(`
      CREATE TRIGGER update_habits_updated_at 
        BEFORE UPDATE ON habits 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('✅ Timestamp triggers created');

    // Test the setup
    console.log('\n🧪 Testing database setup...');
    const testQuery = await dbClient.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    console.log(`✅ Database setup complete! Created ${testQuery.rows[0].table_count} tables`);

    // Show all tables
    const tablesQuery = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    tablesQuery.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    await dbClient.end();
    console.log('\n🎉 PostgreSQL setup completed successfully!');
    console.log('\n💡 Your habit tracker is now ready to use PostgreSQL!');
    console.log('💡 Run "node test-database.js" to verify everything is working');

  } catch (error) {
    console.error('❌ Error setting up PostgreSQL:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your credentials in .env file');
    console.log('3. Ensure the postgres user has database creation privileges');
    console.log('4. Try connecting manually: psql -U postgres');
    process.exit(1);
  }
}

setupPostgreSQL();