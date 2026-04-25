const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    // Create cache with 1 hour TTL (3600 seconds)
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour in seconds
      checkperiod: 300, // Check for expired keys every 5 minutes
      useClones: false // Don't clone objects for better performance
    });

    this.cache.on('expired', (key, value) => {
      console.log(`🗑️ Cache expired for key: ${key}`);
    });

    this.cache.on('set', (key, value) => {
      console.log(`💾 Cache set for key: ${key}`);
    });
  }

  // Generate cache key for user habits
  getUserHabitsKey(userId, category = 'all', sort = 'created_at', order = 'desc') {
    return `habits:${userId}:${category}:${sort}:${order}`;
  }

  // Get habits from cache
  getUserHabits(userId, category, sort, order) {
    const key = this.getUserHabitsKey(userId, category, sort, order);
    const cached = this.cache.get(key);
    
    if (cached) {
      console.log(`🎯 Cache HIT for user habits: ${key}`);
      return cached;
    }
    
    console.log(`❌ Cache MISS for user habits: ${key}`);
    return null;
  }

  // Set habits in cache
  setUserHabits(userId, habits, category, sort, order) {
    const key = this.getUserHabitsKey(userId, category, sort, order);
    
    // Add timestamp to track when data was cached
    const cacheData = {
      habits,
      cachedAt: new Date().toISOString(),
      userId,
      filters: { category, sort, order }
    };
    
    this.cache.set(key, cacheData);
    console.log(`✅ Cached habits for user ${userId} with key: ${key}`);
    return cacheData;
  }

  // Invalidate all habits cache for a user (when habits are modified)
  invalidateUserHabits(userId) {
    const keys = this.cache.keys();
    const userKeys = keys.filter(key => key.startsWith(`habits:${userId}:`));
    
    if (userKeys.length > 0) {
      this.cache.del(userKeys);
      console.log(`🧹 Invalidated ${userKeys.length} habit cache entries for user ${userId}`);
    }
    
    return userKeys.length;
  }

  // Get cache statistics
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      hitRate: this.cache.getStats().hits / (this.cache.getStats().hits + this.cache.getStats().misses) || 0
    };
  }

  // Manual cache clear (for debugging)
  clear() {
    this.cache.flushAll();
    console.log('🧽 Cache cleared manually');
  }

  // Check if cache is fresh (within last 15 minutes for critical operations)
  isFresh(cacheData, maxAgeMinutes = 15) {
    if (!cacheData || !cacheData.cachedAt) return false;
    
    const cacheTime = new Date(cacheData.cachedAt);
    const now = new Date();
    const ageMinutes = (now - cacheTime) / (1000 * 60);
    
    return ageMinutes <= maxAgeMinutes;
  }
}

// Export singleton instance
module.exports = new CacheService();