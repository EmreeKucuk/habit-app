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
  get db() {
    return getDatabase();
  }
};
