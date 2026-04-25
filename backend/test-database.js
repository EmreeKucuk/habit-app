const { initDatabase } = require('./services/databaseService');

async function testDatabase() {
  console.log('🧪 Testing database configuration...');
  console.log('🗄️  Database type:', process.env.DATABASE_TYPE || 'sqlite');
  
  try {
    const db = await initDatabase();
    console.log('✅ Database connected and initialized successfully');
    
    // Test a simple query based on database type
    let testQuery;
    if (process.env.DATABASE_TYPE === 'postgresql') {
      testQuery = 'SELECT NOW() as current_time, version() as pg_version';
    } else {
      testQuery = 'SELECT datetime("now") as current_time, sqlite_version() as sqlite_version';
    }
    
    console.log('🔍 Running test query...');
    const result = await db.query(testQuery);
    
    if (result && result.length > 0) {
      console.log('✅ Database query test passed:');
      console.log('📅 Current time:', result[0].current_time);
      
      if (process.env.DATABASE_TYPE === 'postgresql') {
        console.log('🐘 PostgreSQL version:', result[0].pg_version);
      } else {
        console.log('🗃️  SQLite version:', result[0].sqlite_version);
      }
    }
    
    // Test table creation by checking if users table exists
    console.log('🔍 Checking table structure...');
    let tableCheckQuery;
    if (process.env.DATABASE_TYPE === 'postgresql') {
      tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
    } else {
      tableCheckQuery = `
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `;
    }
    
    const tables = await db.query(tableCheckQuery);
    if (tables && tables.length > 0) {
      console.log('✅ Database tables found:');
      tables.forEach((table, index) => {
        const tableName = table.table_name || table.name;
        console.log(`   ${index + 1}. ${tableName}`);
      });
    } else {
      console.log('⚠️  No tables found - this might be a new database');
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    
    if (process.env.DATABASE_TYPE === 'postgresql') {
      console.log('- Check if PostgreSQL is running: systemctl status postgresql');
      console.log('- Verify connection details in .env file');
      console.log('- Make sure database exists: createdb habit_tracker');
      console.log('- Check user permissions');
    } else {
      console.log('- Check SQLite file permissions');
      console.log('- Verify SQLITE_DB_PATH in .env file');
      console.log('- Make sure directory exists');
    }
    
    console.log('\n📋 Current environment variables:');
    console.log('DATABASE_TYPE:', process.env.DATABASE_TYPE || 'sqlite');
    if (process.env.DATABASE_TYPE === 'postgresql') {
      console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
      console.log('DB_NAME:', process.env.DB_NAME || 'Not set');
      console.log('DB_USER:', process.env.DB_USER || 'Not set');
    } else {
      console.log('SQLITE_DB_PATH:', process.env.SQLITE_DB_PATH || './habit_tracker.db');
    }
  }
}

testDatabase().catch(console.error);
