const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'habit_tracker',
});

async function dropTables() {
  console.log('Starting drop process...');
  
  try {
    // Drop tables in correct order to avoid foreign key constraint errors
    await pool.query('DROP TABLE IF EXISTS group_completions CASCADE;');
    console.log('✅ Dropped group_completions table');
    
    await pool.query('DROP TABLE IF EXISTS group_members CASCADE;');
    console.log('✅ Dropped group_members table');
    
    await pool.query('DROP TABLE IF EXISTS groups CASCADE;');
    console.log('✅ Dropped groups table');
    
    console.log('\nAll group tables have been successfully dropped from the database.');
  } catch (err) {
    console.error('❌ Failed to drop tables:', err);
  } finally {
    await pool.end();
  }
}

dropTables();
