export interface HabitProgress {
  current: number;
  target: number;
  isCompleted: boolean;
  label: string; // e.g. "2/4" or "0/1"
}

/**
 * Get ISO week string for a date (e.g., "2023-W41")
 * Treats Monday as the first day of the week.
 */
function getISOWeek(dateStr: string) {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Computes the habit's progress for its current cycle.
 */
export function getHabitProgress(
  frequency: string,
  frequencyCount: number = 1,
  completedDates: string[] = []
): HabitProgress {
  const sortedDates = [...new Set(completedDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const now = new Date();
  const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

  if (frequency === 'interval') {
    const target = 1;
    let current = 0;
    if (sortedDates.length > 0) {
      const daysSinceLast = Math.floor((new Date(today).getTime() - new Date(sortedDates[0]).getTime()) / 86400000);
      // If less than frequencyCount days have passed, they are safe (completed for the cycle).
      if (daysSinceLast < frequencyCount) {
        current = 1;
      }
    }
    return {
      current,
      target,
      isCompleted: current >= target,
      label: `${current}/${target}`
    };
  } else if (frequency === 'flexible_weekly') {
    const target = frequencyCount;
    let current = 0;
    const thisWeek = getISOWeek(today);
    
    sortedDates.forEach(date => {
      if (getISOWeek(date) === thisWeek) {
        current++;
      }
    });

    return {
      current,
      target,
      isCompleted: current >= target,
      label: `${current}/${target}`
    };
  } else {
    // default: daily
    const target = 1;
    const current = sortedDates.includes(today) ? 1 : 0;
    return {
      current,
      target,
      isCompleted: current >= target,
      label: `${current}/${target}`
    };
  }
}
