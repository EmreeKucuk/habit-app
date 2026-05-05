/**
 * Motivation Score Service
 * 
 * Calculates a dynamic Motivation Score (0-100) for a user based on three weighted inputs:
 * 
 *   1. Success Rate   (50%): % of habits completed in the last 7 days.
 *   2. User Declaration (30%): Inverse mapping of the LLM's difficulty_score (1-5).
 *   3. Reaction Time   (20%): Time to complete after notification (mocked at 80 for now).
 * 
 * Formula: (successRatePoints * 0.50) + (userDeclarationPoints * 0.30) + (reactionTimePoints * 0.20)
 */

const { getDatabase } = require('../database');

// ─── Difficulty Score → Points mapping (inverse) ────────────────
// 1 (Very Easy)    → 100 points
// 2               → 75  points
// 3 (Neutral)      → 50  points
// 4               → 25  points
// 5 (Struggled)    → 0   points
const DIFFICULTY_TO_POINTS = {
  1: 100,
  2: 75,
  3: 50,
  4: 25,
  5: 0,
};

// ─── Weights ────────────────────────────────────────────────────
const WEIGHT_SUCCESS_RATE = 0.50;
const WEIGHT_USER_DECLARATION = 0.30;
const WEIGHT_REACTION_TIME = 0.20;

/**
 * Calculate the 7-day Success Rate for a user.
 * Returns a score from 0 to 100 representing the percentage of
 * expected habit completions that were actually completed.
 *
 * @param {string} userId
 * @returns {Promise<{points: number, completed: number, expected: number}>}
 */
async function calculateSuccessRate(userId) {
  const db = getDatabase();

  // Get the date 7 days ago in YYYY-MM-DD format
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  // Count total active (non-archived) habits for this user
  const habitsResult = await db.get(
    `SELECT COUNT(id) as total FROM habits 
     WHERE user_id = ? AND COALESCE(is_archived, false) = false`,
    [userId]
  );
  const totalHabits = habitsResult?.total || 0;

  if (totalHabits === 0) {
    console.log('[MotivationScore] No active habits found — Success Rate defaults to 0');
    return { points: 0, completed: 0, expected: 0 };
  }

  // Expected completions = totalHabits * 7 days (assuming daily frequency)
  const expectedCompletions = totalHabits * 7;

  // Actual completions in the last 7 days
  const completionsResult = await db.get(
    `SELECT COUNT(id) as completed FROM habit_completions 
     WHERE user_id = ? AND date >= ? AND date <= ?`,
    [userId, sevenDaysAgoStr, todayStr]
  );
  const actualCompletions = completionsResult?.completed || 0;

  // Calculate percentage (cap at 100)
  const percentage = Math.min(100, Math.round((actualCompletions / expectedCompletions) * 100));

  console.log(`[MotivationScore] Success Rate: ${actualCompletions}/${expectedCompletions} = ${percentage}%`);

  return {
    points: percentage,
    completed: actualCompletions,
    expected: expectedCompletions,
  };
}

/**
 * Map the LLM's difficulty_score (1-5) to User Declaration points (0-100).
 * The mapping is inverse: easier tasks → higher motivation points.
 *
 * @param {number} difficultyScore - A value from 1 to 5.
 * @returns {{points: number, rawScore: number}}
 */
function calculateUserDeclaration(difficultyScore) {
  // Clamp to valid range
  const clamped = Math.max(1, Math.min(5, Math.round(difficultyScore)));
  const points = DIFFICULTY_TO_POINTS[clamped] ?? 50; // Default to 50 (neutral) if unexpected

  console.log(`[MotivationScore] User Declaration: difficulty=${clamped} → ${points} points`);

  return {
    points,
    rawScore: clamped,
  };
}

/**
 * Calculate the Reaction Time score.
 * Currently mocked to always return 80 points.
 * Will be replaced with actual notification-to-completion timing in the future.
 *
 * @returns {{points: number, mocked: boolean}}
 */
function calculateReactionTime() {
  const points = 80; // Mocked value

  console.log(`[MotivationScore] Reaction Time: ${points} points (mocked)`);

  return {
    points,
    mocked: true,
  };
}

/**
 * Calculate the overall Motivation Score for a user.
 *
 * @param {string} userId - The user's ID.
 * @param {number} difficultyScore - The difficulty_score from the LLM (1-5).
 * @returns {Promise<{
 *   score: number,
 *   mode: string,
 *   breakdown: {
 *     successRate: {points: number, weight: number, weighted: number, completed: number, expected: number},
 *     userDeclaration: {points: number, weight: number, weighted: number, rawScore: number},
 *     reactionTime: {points: number, weight: number, weighted: number, mocked: boolean}
 *   }
 * }>}
 */
async function calculateMotivationScore(userId, difficultyScore) {
  console.log(`[MotivationScore] ─── Calculating for user ${userId} ───`);

  // 1. Success Rate (50%)
  const successRate = await calculateSuccessRate(userId);
  const weightedSuccessRate = successRate.points * WEIGHT_SUCCESS_RATE;

  // 2. User Declaration (30%)
  const userDeclaration = calculateUserDeclaration(difficultyScore);
  const weightedUserDeclaration = userDeclaration.points * WEIGHT_USER_DECLARATION;

  // 3. Reaction Time (20%)
  const reactionTime = calculateReactionTime();
  const weightedReactionTime = reactionTime.points * WEIGHT_REACTION_TIME;

  // Final score
  const rawScore = weightedSuccessRate + weightedUserDeclaration + weightedReactionTime;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Determine motivation mode
  let mode;
  if (score > 75) {
    mode = 'High';
  } else if (score >= 40) {
    mode = 'Medium';
  } else {
    mode = 'Recovery';
  }

  console.log(`[MotivationScore] Weighted: SR=${weightedSuccessRate.toFixed(1)} + UD=${weightedUserDeclaration.toFixed(1)} + RT=${weightedReactionTime.toFixed(1)}`);
  console.log(`[MotivationScore] Final Score: ${score} → Mode: ${mode}`);
  console.log(`[MotivationScore] ─── Done ───`);

  return {
    score,
    mode,
    breakdown: {
      successRate: {
        points: successRate.points,
        weight: WEIGHT_SUCCESS_RATE,
        weighted: Math.round(weightedSuccessRate * 10) / 10,
        completed: successRate.completed,
        expected: successRate.expected,
      },
      userDeclaration: {
        points: userDeclaration.points,
        weight: WEIGHT_USER_DECLARATION,
        weighted: Math.round(weightedUserDeclaration * 10) / 10,
        rawScore: userDeclaration.rawScore,
      },
      reactionTime: {
        points: reactionTime.points,
        weight: WEIGHT_REACTION_TIME,
        weighted: Math.round(weightedReactionTime * 10) / 10,
        mocked: reactionTime.mocked,
      },
    },
  };
}

/**
 * Persist the motivation score and mode to the database,
 * then return the action rules for the determined mode.
 *
 * @param {string} userId
 * @param {number} score - The calculated motivation score (0-100).
 * @param {string} mode  - "High", "Medium", or "Recovery".
 * @returns {Promise<{score: number, mode: string, actions: object}>}
 */
async function applyMotivationMode(userId, score, mode) {
  const db = getDatabase();

  // Update the user's motivation columns
  await db.run(
    `UPDATE users SET motivation_score = ?, motivation_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [score, mode, userId]
  );

  console.log(`[MotivationScore] Persisted score=${score}, mode=${mode} for user ${userId}`);

  // Return the action rules for this mode
  const actions = getMotivationActions(mode, score);

  return { score, mode, actions };
}

/**
 * Returns the action configuration for each motivation mode.
 *
 * High (>75):     Increase targets, disable standard reminders, send streak congratulations.
 * Medium (40-75): Maintain current routine, standard operations.
 * Recovery (<40): Lower targets drastically, switch to gentle/flexible notifications.
 *
 * @param {string} mode - "High", "Medium", or "Recovery".
 * @param {number} score - The raw score for fine-grained messaging.
 * @returns {object}
 */
function getMotivationActions(mode, score) {
  switch (mode) {
    case 'High':
      return {
        mode: 'High',
        label: 'High Motivation',
        frequencyAdjustment: 'increase',
        targetMultiplier: 1.2,           // Suggest 20% higher targets
        disableStandardReminders: true,
        sendStreakCongratulations: true,
        notificationStyle: 'celebration',
        message: 'You\'re on fire! Consider pushing your goals a bit higher.',
        sproutTone: 'energetic',
      };

    case 'Medium':
      return {
        mode: 'Medium',
        label: 'Steady Progress',
        frequencyAdjustment: 'maintain',
        targetMultiplier: 1.0,           // Keep current targets
        disableStandardReminders: false,
        sendStreakCongratulations: false,
        notificationStyle: 'standard',
        message: 'You\'re doing well — keep up your current routine!',
        sproutTone: 'supportive',
      };

    case 'Recovery':
      return {
        mode: 'Recovery',
        label: 'Recovery Mode',
        frequencyAdjustment: 'decrease',
        targetMultiplier: 0.3,           // Suggest drastically lower targets (e.g. 5 mins instead of 30)
        disableStandardReminders: true,
        sendStreakCongratulations: false,
        notificationStyle: 'gentle',
        message: 'Take it easy — even a small step counts. No pressure.',
        sproutTone: 'gentle',
      };

    default:
      return getMotivationActions('Medium', score);
  }
}

module.exports = { calculateMotivationScore, applyMotivationMode, getMotivationActions };

