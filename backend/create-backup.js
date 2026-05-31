const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'habit_tracker',
});

async function backup() {
  console.log('Starting backup process...');
  
  try {
    // 1. Get all table names
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesQuery.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // 2. Backup Data to JSON
    const dataBackup = {};
    for (const table of tables) {
      console.log(`Exporting data for table: ${table}...`);
      const { rows } = await pool.query(`SELECT * FROM ${table}`);
      dataBackup[table] = rows;
    }
    
    fs.writeFileSync('database_data_backup.json', JSON.stringify(dataBackup, null, 2));
    console.log('✅ Data backup saved to database_data_backup.json');

    // 3. Backup Schema from setup-postgresql.js
    // Since pg_dump isn't available, we'll copy the setup script which creates the exact database
    fs.copyFileSync('setup-postgresql.js', 'setup-postgresql.backup.js');
    console.log('✅ Schema creation script backed up to setup-postgresql.backup.js');
    
    // Also backup databaseService.js
    fs.copyFileSync('services/databaseService.js', 'services/databaseService.backup.js');
    console.log('✅ Database service backed up to services/databaseService.backup.js');

    console.log('\nBackup completed successfully! You now have a full snapshot of your data and schema.');
    
  } catch (err) {
    console.error('❌ Backup failed:', err);
  } finally {
    await pool.end();
  }
}

backup();
