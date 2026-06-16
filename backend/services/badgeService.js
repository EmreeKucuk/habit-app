/**
 * Badge Service — checks and awards badges to users.
 *
 * Called after habit completion, habit creation, and profile updates.
 * Evaluates all 28 badge conditions against the database and persists
 * newly earned badges into the `user_badges` table.
 */

const { getDatabase } = require('../database');
const { calculateStreak } = require('../utils/streakCalculator');

// ─── Badge Definitions ──────────────────────────────────────────────────────

const BADGE_DEFINITIONS = [
  // Getting Started
  { id: 'first-habit',       name: 'Getting Started',      icon: '🌱' },
  { id: 'first-completion',  name: 'First Step',            icon: '✅' },
  { id: 'profile-setup',     name: 'Profile Master',        icon: '👤' },

  // Streaks
  { id: 'three-day-streak',   name: 'Streak Starter',       icon: '🔥' },
  { id: 'week-warrior',       name: 'Week Warrior',         icon: '📅' },
  { id: 'two-week-champion',  name: 'Two Week Champion',    icon: '🏅' },
  { id: 'monthly-master',     name: 'Monthly Master',       icon: '🏆' },
  { id: 'hundred-day-legend', name: 'Hundred Day Legend',    icon: '👑' },

  // Volume
  { id: 'ten-completions',    name: 'Getting Momentum',     icon: '⚡' },
  { id: 'fifty-completions',  name: 'Half Century',         icon: '🎖️' },
  { id: 'hundred-club',       name: 'Hundred Club',         icon: '💯' },
  { id: 'five-hundred-club',  name: 'Five Hundred Club',    icon: '🌟' },
  { id: 'thousand-club',      name: 'Thousand Club',        icon: '💎' },

  // Collection
  { id: 'habit-collector',    name: 'Habit Collector',      icon: '📚' },
  { id: 'habit-enthusiast',   name: 'Habit Enthusiast',     icon: '🎯' },
  { id: 'habit-master',       name: 'Habit Master',         icon: '🧠' },

  // Category
  { id: 'health-focused',     name: 'Health Focused',       icon: '💪' },
  { id: 'fitness-fanatic',    name: 'Fitness Fanatic',      icon: '🏃' },
  { id: 'mindful-master',     name: 'Mindful Master',       icon: '🧘' },
  { id: 'productivity-pro',   name: 'Productivity Pro',     icon: '📋' },
  { id: 'social-butterfly',   name: 'Social Butterfly',     icon: '🦋' },

  // Time-based
  { id: 'early-bird',         name: 'Early Bird',           icon: '🌅' },
  { id: 'night-owl',          name: 'Night Owl',            icon: '🦉' },
  { id: 'weekend-warrior',    name: 'Weekend Warrior',      icon: '🎉' },

  // Consistency
  { id: 'perfectionist',      name: 'Perfectionist',        icon: '💎' },
  { id: 'consistency-king',   name: 'Consistency King',     icon: '👑' },
  { id: 'daily-dedication',   name: 'Daily Dedication',     icon: '🔄' },

  // Special
  { id: 'comeback-story',     name: 'Comeback Story',       icon: '🔄' },
  { id: 'habit-sharer',       name: 'Habit Sharer',         icon: '🤝' },
  { id: 'goal-crusher',       name: 'Goal Crusher',         icon: '🎯' },
  { id: 'zen-master',         name: 'Zen Master',           icon: '☯️' },
  { id: 'level-up',           name: 'Level Up',             icon: '⬆️' },
];

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Check all badge conditions for a user and award any newly earned badges.
 * @param {string} userId
 * @returns {Promise<Array<{id: string, name: string, icon: string}>>} Newly awarded badges
 */
async function checkAndAwardBadges(userId) {
  const db = getDatabase();

  try {
    // 1. Gather all the data we need in parallel
    const [user, habits, totalCompletionsRow, alreadyEarned] = await Promise.all([
      db.get('SELECT * FROM users WHERE id = ?', [userId]),
      db.all(
        `SELECT h.* FROM habits h WHERE h.user_id = ? AND COALESCE(h.is_archived, false) = false`,
        [userId]
      ),
      db.get(
        'SELECT COUNT(*) as count FROM habit_completions WHERE user_id = ?',
        [userId]
      ),
      db.all(
        'SELECT badge_id FROM user_badges WHERE user_id = ?',
        [userId]
      ),
    ]);

    if (!user) return [];

    const alreadyEarnedIds = new Set(alreadyEarned.map(r => r.badge_id));
    const totalCompletions = totalCompletionsRow?.count || 0;

    // 2. Get completions for each habit (needed for streak & per-habit checks)
    const habitsWithCompletions = await Promise.all(
      habits.map(async (habit) => {
        const completions = await db.all(
          'SELECT date, completed_at FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
          [habit.id]
        );

        const completedDates = completions.map(row => {
          let dateString = row.date;
          if (dateString instanceof Date) {
            const year = dateString.getFullYear();
            const month = String(dateString.getMonth() + 1).padStart(2, '0');
            const day = String(dateString.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
          if (typeof dateString === 'string' && dateString.includes('T')) {
            return dateString.split('T')[0];
          }
          try {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          } catch {
            return null;
          }
        }).filter(Boolean);

        const { currentStreak, longestStreak } = calculateStreak(
          completedDates,
          habit.frequency,
          habit.frequency_count || 1
        );

        return {
          ...habit,
          completedDates,
          completionTimestamps: completions.map(r => r.completed_at),
          currentStreak,
          longestStreak,
        };
      })
    );

    // 3. Evaluate all badge conditions
    const earnedBadgeIds = evaluateAllBadges(user, habitsWithCompletions, totalCompletions);

    // 4. Find newly earned badges (not already in DB)
    const newBadgeIds = earnedBadgeIds.filter(id => !alreadyEarnedIds.has(id));

    // 5. Insert new badges into user_badges
    for (const badgeId of newBadgeIds) {
      try {
        await db.run(
          `INSERT INTO user_badges (id, user_id, badge_id, earned_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [require('uuid').v4(), userId, badgeId]
        );
      } catch (err) {
        // Ignore unique constraint violations (race condition safety)
        if (!err.message?.includes('UNIQUE') && !err.message?.includes('duplicate')) {
          console.error(`Failed to insert badge ${badgeId}:`, err.message);
        }
      }
    }

    // 6. Return info about newly earned badges
    const newBadges = newBadgeIds.map(id => {
      const def = BADGE_DEFINITIONS.find(b => b.id === id);
      return def ? { id: def.id, name: def.name, icon: def.icon } : null;
    }).filter(Boolean);

    if (newBadges.length > 0) {
      console.log(`🏆 User ${userId} earned ${newBadges.length} new badge(s):`, newBadges.map(b => b.name).join(', '));
    }

    return newBadges;
  } catch (error) {
    console.error('Badge check error:', error);
    return [];
  }
}

// ─── Badge Evaluation Logic ──────────────────────────────────────────────────

/**
 * Evaluate all 28+ badge conditions and return an array of earned badge IDs.
 */
function evaluateAllBadges(user, habits, totalCompletions) {
  const earned = [];

  // ── Getting Started ──────────────────────────────────────────────────────
  // first-habit: User has ≥1 habit
  if (habits.length > 0) {
    earned.push('first-habit');
  }

  // first-completion: User has ≥1 total completion
  if (totalCompletions >= 1) {
    earned.push('first-completion');
  }

  // profile-setup: User has bio AND (profile_photo OR avatar_icon)
  if (user.bio && (user.profile_photo || user.avatar_icon)) {
    earned.push('profile-setup');
  }

  // ── Streak Badges ────────────────────────────────────────────────────────
  const maxCurrentStreak = Math.max(0, ...habits.map(h => h.currentStreak));
  const maxLongestStreak = Math.max(0, ...habits.map(h => h.longestStreak));
  const bestStreak = Math.max(maxCurrentStreak, maxLongestStreak);

  if (bestStreak >= 3) earned.push('three-day-streak');
  if (bestStreak >= 7) earned.push('week-warrior');
  if (bestStreak >= 14) earned.push('two-week-champion');
  if (bestStreak >= 30) earned.push('monthly-master');
  if (bestStreak >= 100) earned.push('hundred-day-legend');

  // ── Volume Badges ────────────────────────────────────────────────────────
  if (totalCompletions >= 10)   earned.push('ten-completions');
  if (totalCompletions >= 50)   earned.push('fifty-completions');
  if (totalCompletions >= 100)  earned.push('hundred-club');
  if (totalCompletions >= 500)  earned.push('five-hundred-club');
  if (totalCompletions >= 1000) earned.push('thousand-club');

  // ── Habit Collection Badges ──────────────────────────────────────────────
  if (habits.length >= 5)  earned.push('habit-collector');
  if (habits.length >= 10) earned.push('habit-enthusiast');
  if (habits.length >= 20) earned.push('habit-master');

  // ── Category Badges ──────────────────────────────────────────────────────
  const categoryCompletions = {};
  for (const habit of habits) {
    const cat = habit.category;
    categoryCompletions[cat] = (categoryCompletions[cat] || 0) + habit.completedDates.length;
  }

  if ((categoryCompletions['health'] || 0) >= 25)       earned.push('health-focused');
  if ((categoryCompletions['sport'] || 0) >= 25)        earned.push('fitness-fanatic');
  if ((categoryCompletions['mindfulness'] || 0) >= 25)  earned.push('mindful-master');
  if ((categoryCompletions['productivity'] || 0) >= 25) earned.push('productivity-pro');
  if ((categoryCompletions['social'] || 0) >= 25)       earned.push('social-butterfly');

  // ── Time-based Badges ────────────────────────────────────────────────────
  let earlyBirdCount = 0;
  let nightOwlCount = 0;
  let weekendDays = new Set();

  for (const habit of habits) {
    for (let i = 0; i < habit.completedDates.length; i++) {
      const dateStr = habit.completedDates[i];
      const timestamp = habit.completionTimestamps[i];

      // Early bird / night owl — use the completion timestamp
      if (timestamp) {
        const completedAt = new Date(timestamp);
        const hour = completedAt.getHours();
        if (hour < 8) earlyBirdCount++;
        if (hour >= 22) nightOwlCount++;
      }

      // Weekend warrior — count distinct weekend dates
      const dayDate = new Date(dateStr);
      const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays.add(dateStr);
      }
    }
  }

  if (earlyBirdCount >= 10) earned.push('early-bird');
  if (nightOwlCount >= 10)  earned.push('night-owl');
  if (weekendDays.size >= 10) earned.push('weekend-warrior');

  // ── Consistency Badges ───────────────────────────────────────────────────
  const dailyHabits = habits.filter(h => h.frequency === 'daily');

  if (dailyHabits.length > 0) {
    // perfectionist: All daily habits completed for 7 consecutive days
    // consistency-king: All daily habits completed for 30 consecutive days
    const perfectDays = countConsecutivePerfectDays(dailyHabits);
    if (perfectDays >= 7) earned.push('perfectionist');
    if (perfectDays >= 30) earned.push('consistency-king');
  }

  // daily-dedication: ≥1 habit completed every day for 30 consecutive days
  const dedicationDays = countConsecutiveDaysWithAnyCompletion(habits);
  if (dedicationDays >= 30) earned.push('daily-dedication');

  // ── Special Badges ───────────────────────────────────────────────────────
  // comeback-story: Completed a habit after 7+ day gap
  if (checkComebackStory(habits)) earned.push('comeback-story');

  // habit-sharer: public_profile AND share_progress
  if (user.public_profile && user.share_progress) earned.push('habit-sharer');

  // goal-crusher: ≥90% weekly completion rate (last full week)
  if (dailyHabits.length > 0 && checkGoalCrusher(dailyHabits)) {
    earned.push('goal-crusher');
  }

  // zen-master: 30-day streak on a mindfulness habit
  const mindfulnessHabits = habits.filter(h => h.category === 'mindfulness');
  const bestMindfulnessStreak = Math.max(
    0,
    ...mindfulnessHabits.map(h => Math.max(h.currentStreak, h.longestStreak))
  );
  if (bestMindfulnessStreak >= 30) earned.push('zen-master');

  // level-up: User level ≥ 10
  if (user.level >= 10) earned.push('level-up');

  return earned;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Count the maximum number of consecutive days where ALL daily habits were completed.
 */
function countConsecutivePerfectDays(dailyHabits) {
  if (dailyHabits.length === 0) return 0;

  // Build a set of dates where ALL daily habits were completed
  const allDates = new Set();
  for (const habit of dailyHabits) {
    for (const d of habit.completedDates) {
      allDates.add(d);
    }
  }

  let maxConsecutive = 0;
  let currentConsecutive = 0;

  // Check backwards from today
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

    const allCompleted = dailyHabits.every(h => h.completedDates.includes(dateStr));
    if (allCompleted) {
      currentConsecutive++;
      if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive;
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutive;
}

/**
 * Count the maximum number of consecutive days where at least 1 habit was completed.
 */
function countConsecutiveDaysWithAnyCompletion(habits) {
  if (habits.length === 0) return 0;

  // Collect all unique completion dates across all habits
  const allDates = new Set();
  for (const habit of habits) {
    for (const d of habit.completedDates) {
      allDates.add(d);
    }
  }

  let maxConsecutive = 0;
  let currentConsecutive = 0;

  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

    if (allDates.has(dateStr)) {
      currentConsecutive++;
      if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive;
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutive;
}

/**
 * Check if any habit has a 7+ day gap followed by a completion (comeback).
 */
function checkComebackStory(habits) {
  for (const habit of habits) {
    if (habit.completedDates.length < 2) continue;

    // Sort ascending to find gaps
    const sorted = [...habit.completedDates].sort();
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const gapDays = Math.floor((curr - prev) / 86400000);
      if (gapDays >= 7) return true;
    }
  }
  return false;
}

/**
 * Check if user completed ≥90% of daily habits in the last full week.
 */
function checkGoalCrusher(dailyHabits) {
  if (dailyHabits.length === 0) return false;

  const today = new Date();
  let totalExpected = 0;
  let totalCompleted = 0;

  // Check the last 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

    totalExpected += dailyHabits.length;
    totalCompleted += dailyHabits.filter(h => h.completedDates.includes(dateStr)).length;
  }

  return totalExpected > 0 && (totalCompleted / totalExpected) >= 0.9;
}

/**
 * Get all earned badges for a user from the database.
 * @param {string} userId
 * @returns {Promise<Array<{badge_id: string, earned_at: string}>>}
 */
async function getEarnedBadges(userId) {
  const db = getDatabase();
  return await db.all(
    'SELECT badge_id, earned_at FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC',
    [userId]
  );
}

module.exports = {
  checkAndAwardBadges,
  getEarnedBadges,
  BADGE_DEFINITIONS,
};
