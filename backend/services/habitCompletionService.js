/**
 * Habit Completion Service
 * Shared logic for marking a habit as completed.
 * Used by both the REST endpoint (POST /api/habits/:id/complete)
 * and the Sprout chat auto-completion flow.
 */

const { getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

/**
 * Mark a habit as completed for a given date.
 * Performs: ownership check, duplicate guard, XP award, and duplicate habit sync.
 *
 * @param {string} habitId - The habit ID to complete.
 * @param {string} userId  - The authenticated user's ID.
 * @param {object} [options] - Optional completion metadata.
 * @param {string} [options.date]  - Date in YYYY-MM-DD format (defaults to today).
 * @param {string} [options.notes] - Completion notes.
 * @param {string} [options.mood]  - Mood tag.
 * @param {number} [options.value] - Completion value (defaults to 1).
 * @returns {Promise<{
 *   success: boolean,
 *   completed: boolean,
 *   alreadyCompleted?: boolean,
 *   habitNotFound?: boolean,
 *   xpGained: number,
 *   duplicatesSynced: number,
 *   habitName: string|null
 * }>}
 */
async function completeHabit(habitId, userId, options = {}) {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const completionDate = options.date || today;
  const { notes = null, mood = null, value = 1 } = options;

  // 1. Verify the habit belongs to this user
  const habit = await db.get(
    'SELECT * FROM habits WHERE id = ? AND user_id = ?',
    [habitId, userId]
  );

  if (!habit) {
    console.log(`[HabitCompletion] Habit ${habitId} not found for user ${userId}`);
    return {
      success: false,
      completed: false,
      habitNotFound: true,
      xpGained: 0,
      duplicatesSynced: 0,
      habitName: null,
    };
  }

  // 2. Check if already completed for this date
  const existingCompletion = await db.get(
    'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
    [habitId, completionDate]
  );

  if (existingCompletion) {
    console.log(`[HabitCompletion] "${habit.name}" already completed on ${completionDate} — skipping`);
    return {
      success: true,
      completed: true,
      alreadyCompleted: true,
      xpGained: 0,
      duplicatesSynced: 0,
      habitName: habit.name,
    };
  }

  // 3. Insert the completion
  const completionId = uuidv4();
  await db.run(
    `INSERT INTO habit_completions (id, habit_id, user_id, date, value, notes, mood)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [completionId, habitId, userId, completionDate, value, notes, mood]
  );

  // 4. Award XP (only once per day per habit name)
  const todayXPCheck = await db.get(
    `SELECT COUNT(*) as count
     FROM habit_completions hc
     JOIN habits h ON hc.habit_id = h.id
     WHERE h.user_id = ? AND h.name = ? AND hc.date = ?`,
    [userId, habit.name, completionDate]
  );

  let xpGain = 0;
  if (todayXPCheck.count <= 1) {
    xpGain = 10;
    await db.run(
      'UPDATE users SET xp = xp + ? WHERE id = ?',
      [xpGain, userId]
    );
    console.log(`[HabitCompletion] 💎 +${xpGain} XP for completing "${habit.name}"`);
  }

  // 5. Auto-complete duplicate habits with the same name
  const duplicateHabits = await db.all(
    'SELECT id FROM habits WHERE user_id = ? AND name = ? AND id != ?',
    [userId, habit.name, habitId]
  );

  let duplicatesSynced = 0;
  for (const dupHabit of duplicateHabits) {
    const dupExisting = await db.get(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
      [dupHabit.id, completionDate]
    );

    if (!dupExisting) {
      await db.run(
        `INSERT INTO habit_completions (id, habit_id, user_id, date, value, notes, mood)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), dupHabit.id, userId, completionDate, value, notes, mood]
      );
      duplicatesSynced++;
    }
  }

  console.log(`[HabitCompletion] ✅ "${habit.name}" completed. XP: +${xpGain}, duplicates synced: ${duplicatesSynced}`);

  return {
    success: true,
    completed: true,
    alreadyCompleted: false,
    xpGained: xpGain,
    duplicatesSynced,
    habitName: habit.name,
  };
}

module.exports = { completeHabit };
