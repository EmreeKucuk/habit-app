import { Badge, Habit, User } from '../types';

// Predefined badges with their earning criteria
export const AVAILABLE_BADGES: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  {
    id: 'first-habit',
    name: 'Getting Started',
    description: 'Created your first habit',
    icon: '🌱'
  },
  {
    id: 'first-week',
    name: 'Week Warrior',
    description: 'Completed a habit for 7 days straight',
    icon: '📅'
  },
  {
    id: 'first-month',
    name: 'Monthly Master',
    description: 'Completed a habit for 30 days straight',
    icon: '🏆'
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete 5 habits before 8 AM',
    icon: '🌅'
  },
  {
    id: 'habit-collector',
    name: 'Habit Collector',
    description: 'Have 10 active habits',
    icon: '📚'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete all habits for 3 days in a row',
    icon: '💎'
  },
  {
    id: 'category-master',
    name: 'Category Master',
    description: 'Have habits in all 7 categories',
    icon: '🎯'
  },
  {
    id: 'hundred-club',
    name: 'Hundred Club',
    description: 'Complete 100 total habit instances',
    icon: '💯'
  },
  {
    id: 'streak-legend',
    name: 'Streak Legend',
    description: 'Achieve a 50-day streak',
    icon: '🔥'
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Add 5 friends',
    icon: '🦋'
  },
  {
    id: 'level-up',
    name: 'Level Up',
    description: 'Reach level 10',
    icon: '⭐'
  },
  {
    id: 'overachiever',
    name: 'Overachiever',
    description: 'Maintain 95% completion rate for a month',
    icon: '👑'
  }
];

// Function to calculate which badges a user has earned
export function calculateEarnedBadges(user: User, habits: Habit[]): Badge[] {
  const earnedBadges: Badge[] = [];
  const now = new Date();

  // Helper function to add earned badge
  const addBadge = (badgeId: string, earnedAt?: Date) => {
    const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
    if (badge) {
      earnedBadges.push({
        ...badge,
        earned: true,
        earnedAt: earnedAt?.toISOString() || now.toISOString()
      });
    }
  };

  // Getting Started - Created first habit
  if (habits.length > 0) {
    const firstHabit = habits.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    addBadge('first-habit', new Date(firstHabit.createdAt));
  }

  // Week Warrior - 7 day streak
  const hasWeekStreak = habits.some(habit => habit.streak >= 7);
  if (hasWeekStreak) {
    addBadge('first-week');
  }

  // Monthly Master - 30 day streak
  const hasMonthStreak = habits.some(habit => habit.streak >= 30);
  if (hasMonthStreak) {
    addBadge('first-month');
  }

  // Habit Collector - 10 active habits
  if (habits.length >= 10) {
    addBadge('habit-collector');
  }

  // Category Master - habits in all categories
  const categories = new Set(habits.map(h => h.category));
  const allCategories = ['health', 'sport', 'learning', 'productivity', 'mindfulness', 'social', 'other'];
  if (allCategories.every(cat => categories.has(cat as any))) {
    addBadge('category-master');
  }

  // Hundred Club - 100 total completions
  const totalCompletions = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0);
  if (totalCompletions >= 100) {
    addBadge('hundred-club');
  }

  // Streak Legend - 50 day streak
  const hasLegendStreak = habits.some(habit => habit.streak >= 50);
  if (hasLegendStreak) {
    addBadge('streak-legend');
  }

  // Level Up - reach level 10
  if (user.level >= 10) {
    addBadge('level-up');
  }

  // Perfectionist - Complete all habits for 3 days in a row
  if (habits.length > 0) {
    const today = new Date();
    let consecutivePerfectDays = 0;
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dailyHabits = habits.filter(h => h.frequency === 'daily');
      const completedOnDate = dailyHabits.filter(h => h.completedDates.includes(dateStr));
      
      if (dailyHabits.length > 0 && completedOnDate.length === dailyHabits.length) {
        consecutivePerfectDays++;
        if (consecutivePerfectDays >= 3) {
          addBadge('perfectionist');
          break;
        }
      } else {
        consecutivePerfectDays = 0;
      }
    }
  }

  // Overachiever - 95% completion rate for a month
  if (habits.length > 0) {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const dailyHabits = habits.filter(h => h.frequency === 'daily');
    if (dailyHabits.length > 0) {
      let totalExpected = 0;
      let totalCompleted = 0;
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        totalExpected += dailyHabits.length;
        totalCompleted += dailyHabits.filter(h => h.completedDates.includes(dateStr)).length;
      }
      
      const completionRate = totalCompleted / totalExpected;
      if (completionRate >= 0.95) {
        addBadge('overachiever');
      }
    }
  }

  return earnedBadges;
}

// Function to get all badges (earned and unearned)
export function getAllBadges(user: User, habits: Habit[]): Badge[] {
  const earnedBadges = calculateEarnedBadges(user, habits);
  const earnedIds = new Set(earnedBadges.map(b => b.id));
  
  const unearnedBadges = AVAILABLE_BADGES
    .filter(badge => !earnedIds.has(badge.id))
    .map(badge => ({ ...badge, earned: false }));
  
  return [...earnedBadges, ...unearnedBadges];
}