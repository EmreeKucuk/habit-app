/**
 * Shared utility to calculate habit streaks based on complex frequencies.
 * Supports: 'daily', 'interval', 'flexible_weekly'.
 */

/**
 * Get ISO week string for a date (e.g., "2023-W41")
 * Treats Monday as the first day of the week.
 */
function getISOWeek(dateStr) {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Calculates both current and longest streaks.
 * @param {string[]} completedDates - Array of YYYY-MM-DD date strings.
 * @param {string} frequency - 'daily', 'interval', or 'flexible_weekly' (defaults to 'daily' if unrecognized)
 * @param {number} frequencyCount - The interval or times-per-week count.
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
function calculateStreak(completedDates, frequency, frequencyCount = 1) {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates descending
  const sortedDates = [...new Set(completedDates)].sort((a, b) => new Date(b) - new Date(a));
  
  const now = new Date();
  const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

  let currentStreak = 0;
  let longestStreak = 0;

  if (frequency === 'interval') {
    // Rolling interval: difference between consecutive completions must be <= frequencyCount days
    // Max allowed gap is frequencyCount days.
    const maxGap = frequencyCount;

    // Check if current streak is broken
    const daysSinceLast = Math.floor((new Date(today) - new Date(sortedDates[0])) / 86400000);
    if (daysSinceLast > maxGap) {
      currentStreak = 0;
    } else {
      currentStreak = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const gap = Math.floor((new Date(sortedDates[i]) - new Date(sortedDates[i+1])) / 86400000);
        if (gap <= maxGap) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const gap = Math.floor((new Date(sortedDates[i]) - new Date(sortedDates[i+1])) / 86400000);
      if (gap <= maxGap) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }

  } else if (frequency === 'flexible_weekly') {
    // Calendar week streak. User needs frequencyCount completions per week.
    const weeksMap = {};
    sortedDates.forEach(date => {
      const weekStr = getISOWeek(date);
      weeksMap[weekStr] = (weeksMap[weekStr] || 0) + 1;
    });

    const thisWeek = getISOWeek(today);
    
    // Get last week's string by subtracting 7 days from today
    const lastWeekDate = new Date(today);
    lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
    const lastWeek = getISOWeek(lastWeekDate.toISOString().split('T')[0]);

    // Check current streak
    let checkDate = new Date(today);
    let checkWeek = thisWeek;
    
    // If this week is not met yet, check if last week was met
    if ((weeksMap[thisWeek] || 0) < frequencyCount) {
      if ((weeksMap[lastWeek] || 0) < frequencyCount) {
        currentStreak = 0; // Broken streak
      } else {
        // This week isn't over, last week was met, so streak starts from last week
        checkDate = lastWeekDate;
        checkWeek = lastWeek;
      }
    }

    if (currentStreak !== 0) {
      // Trace backwards week by week
      while (true) {
        if ((weeksMap[checkWeek] || 0) >= frequencyCount) {
          currentStreak++;
          checkDate.setUTCDate(checkDate.getUTCDate() - 7);
          checkWeek = getISOWeek(checkDate.toISOString().split('T')[0]);
        } else {
          break;
        }
      }
    }

    // Longest streak: iterate through all sorted weeks (we can sort week keys)
    const weekKeys = Object.keys(weeksMap).sort((a, b) => b.localeCompare(a));
    let tempStreak = 0;
    
    // To find consecutive weeks, we can start from the first valid week and trace backwards
    // Or just check each week in the map
    for (let i = 0; i < weekKeys.length; i++) {
      const startWeek = weekKeys[i];
      if (weeksMap[startWeek] >= frequencyCount) {
        let tStreak = 1;
        // Parse year and week roughly to step back
        let traceDate = new Date(sortedDates.find(d => getISOWeek(d) === startWeek));
        while (true) {
          traceDate.setUTCDate(traceDate.getUTCDate() - 7);
          const prevWeek = getISOWeek(traceDate.toISOString().split('T')[0]);
          if (weeksMap[prevWeek] >= frequencyCount) {
            tStreak++;
          } else {
            break;
          }
        }
        if (tStreak > longestStreak) longestStreak = tStreak;
      }
    }

  } else {
    // Default: 'daily'
    // Ensure we also calculate longest streak properly
    const daysSinceLast = Math.floor((new Date(today) - new Date(sortedDates[0])) / 86400000);
    if (daysSinceLast > 1) {
      currentStreak = 0;
    } else {
      currentStreak = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const gap = Math.floor((new Date(sortedDates[i]) - new Date(sortedDates[i+1])) / 86400000);
        if (gap === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const gap = Math.floor((new Date(sortedDates[i]) - new Date(sortedDates[i+1])) / 86400000);
      if (gap === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }
  }

  return { currentStreak, longestStreak };
}

module.exports = { calculateStreak };
