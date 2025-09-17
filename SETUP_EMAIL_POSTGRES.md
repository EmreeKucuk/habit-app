# Email & PostgreSQL Setup Guide

## 📧 Email Configuration

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Click "App passwords"
   - Generate a password for "Mail"
   - Copy the 16-character password

3. **Update .env file**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Option 2: SendGrid (Recommended for Production)

1. **Create SendGrid Account**: https://sendgrid.com/
2. **Generate API Key**:
   - Go to Settings → API Keys
   - Create new API key with "Full Access"
   - Copy the API key

3. **Update .env file**:
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key
```

### Option 3: Custom SMTP

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

## 🐘 PostgreSQL Setup

### Installation

#### Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run installer and remember the password you set for 'postgres' user
3. Add PostgreSQL to PATH (usually done automatically)

#### macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database
createdb habit_tracker
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql
CREATE DATABASE habit_tracker;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE habit_tracker TO your_username;
\q
```

### Database Configuration

1. **Create Database**:
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE habit_tracker;
CREATE USER habit_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE habit_tracker TO habit_user;

-- Connect to the new database
\c habit_tracker

-- Grant additional permissions
GRANT ALL ON SCHEMA public TO habit_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO habit_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO habit_user;
```

2. **Update .env file**:
```env
# Switch to PostgreSQL
DATABASE_TYPE=postgresql

# Connection details
DB_HOST=localhost
DB_PORT=5432
DB_NAME=habit_tracker
DB_USER=habit_user
DB_PASSWORD=secure_password_here
DB_SSL=false

# Or use connection string
DATABASE_URL=postgresql://habit_user:secure_password_here@localhost:5432/habit_tracker
```

## 🚀 Testing the Setup

### Test Email Configuration

Create a test script to verify email is working:

```javascript
// test-email.js
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('Testing email configuration...');
  
  const testResult = await emailService.testConnection();
  if (testResult.success) {
    console.log('✅ Email service connected successfully');
    
    // Send test email
    const result = await emailService.sendEmail(
      'your-test-email@example.com',
      'Test Email from Habit Tracker',
      'This is a test email to verify the configuration is working!'
    );
    
    if (result.success) {
      console.log('✅ Test email sent successfully');
    } else {
      console.log('❌ Failed to send test email:', result.error);
    }
  } else {
    console.log('❌ Email service connection failed:', testResult.error);
  }
}

testEmail();
```

Run: `node test-email.js`

### Test Database Connection

```javascript
// test-database.js
const { initDatabase } = require('./services/databaseService');

async function testDatabase() {
  console.log('Testing database configuration...');
  
  try {
    const db = await initDatabase();
    console.log('✅ Database connected and initialized successfully');
    
    // Test a simple query
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database query test passed:', result[0]);
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

testDatabase();
```

Run: `node test-database.js`

## 🔄 Migration from SQLite to PostgreSQL

If you want to migrate existing SQLite data to PostgreSQL:

1. **Export SQLite data**:
```bash
# Install sqlite3 CLI tool
sqlite3 habit_tracker.db .dump > sqlite_dump.sql
```

2. **Convert and import to PostgreSQL**:
```bash
# Clean up the dump file for PostgreSQL compatibility
sed 's/AUTOINCREMENT/SERIAL/g' sqlite_dump.sql > postgres_dump.sql

# Import to PostgreSQL
psql -U habit_user -d habit_tracker -f postgres_dump.sql
```

## 🛠️ Troubleshooting

### Email Issues:
- **Gmail "Less secure app access"**: Use App Passwords instead
- **SendGrid not sending**: Check API key permissions
- **SMTP timeout**: Verify host, port, and firewall settings

### Database Issues:
- **Connection refused**: Check if PostgreSQL service is running
- **Authentication failed**: Verify username/password
- **Database doesn't exist**: Create the database first
- **Permission denied**: Grant proper privileges to the user

### Common Commands:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Connect to database
psql -U habit_user -d habit_tracker

# List databases
\l

# List tables
\dt

# Describe table
\d table_name
```

## 📝 Environment Variables Checklist

Make sure your `.env` file has all required variables:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3001

# JWT (generate strong random strings)
JWT_SECRET=your-super-long-random-secret-key
JWT_REFRESH_SECRET=your-super-long-random-refresh-key

# Email (choose one method)
EMAIL_FROM=noreply@habittracker.com
EMAIL_SERVICE=gmail  # or sendgrid, smtp
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Database (choose sqlite or postgresql)
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://habit_user:password@localhost:5432/habit_tracker
```

## 🎯 Next Steps

1. Set up your email provider and test the configuration
2. Install and configure PostgreSQL
3. Update your `.env` file with the correct values
4. Run the test scripts to verify everything works
5. Restart your application and test user registration/email verification

Your habit tracker will now have professional email capabilities and a robust PostgreSQL database!
