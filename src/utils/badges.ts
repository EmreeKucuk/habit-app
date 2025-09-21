import { Badge, Habit, User } from '../types';

// Predefined badges with their earning criteria
export const AVAILABLE_BADGES: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  // Getting Started Badges
  {
    id: 'first-habit',
    name: 'Getting Started',
    description: 'Created your first habit',
    icon: '🌱'
  },
  {
    id: 'first-completion',
    name: 'First Step',
    description: 'Completed your first habit',
    icon: '✅'
  },
  {
    id: 'profile-setup',
    name: 'Profile Master',
    description: 'Complete your profile with photo and bio',
    icon: '👤'
  },

  // Streak Badges
  {
    id: 'three-day-streak',
    name: 'Streak Starter',
    description: 'Complete a habit for 3 days straight',
    icon: '🔥'
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Complete a habit for 7 days straight',
    icon: '📅'
  },
  {
    id: 'two-week-champion',
    name: 'Two Week Champion',
    description: 'Complete a habit for 14 days straight',
    icon: '🏅'
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Complete a habit for 30 days straight',
    icon: '🏆'
  },
  {
    id: 'hundred-day-legend',
    name: 'Hundred Day Legend',
    description: 'Complete a habit for 100 days straight',
    icon: '👑'
  },

  // Volume Badges
  {
    id: 'ten-completions',
    name: 'Getting Momentum',
    description: 'Complete 10 total habit instances',
    icon: '⚡'
  },
  {
    id: 'fifty-completions',
    name: 'Half Century',
    description: 'Complete 50 total habit instances',
    icon: '🎖️'
  },
  {
    id: 'hundred-club',
    name: 'Hundred Club',
    description: 'Complete 100 total habit instances',
    icon: '💯'
  },
  {
    id: 'five-hundred-club',
    name: 'Five Hundred Club',
    description: 'Complete 500 total habit instances',
    icon: '🌟'
  },
  {
    id: 'thousand-club',
    name: 'Thousand Club',
    description: 'Complete 1000 total habit instances',
    icon: '💎'
  },

  // Habit Collection Badges
  {
    id: 'habit-collector',
    name: 'Habit Collector',
    description: 'Have 5 active habits',
    icon: '📚'
  },
  {
    id: 'habit-enthusiast',
    name: 'Habit Enthusiast',
    description: 'Have 10 active habits',
    icon: '🎯'
  },
  {
    id: 'habit-master',
    name: 'Habit Master',
    description: 'Have 20 active habits',
    icon: '🧠'
  },

  // Category Badges
  {
    id: 'health-focused',
    name: 'Health Focused',
    description: 'Complete 25 health-related habits',
    icon: '💪'
  },
  {
    id: 'fitness-fanatic',
    name: 'Fitness Fanatic',
    description: 'Complete 25 fitness habits',
    icon: '🏃'
  },
  {
    id: 'mindful-master',
    name: 'Mindful Master',
    description: 'Complete 25 mindfulness habits',
    icon: '🧘'
  },
  {
    id: 'productivity-pro',
    name: 'Productivity Pro',
    description: 'Complete 25 productivity habits',
    icon: '�'
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Complete 25 social habits',
    icon: '🦋'
  },

  // Time-based Badges
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete 10 habits before 8 AM',
    icon: '🌅'
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete 10 habits after 10 PM',
    icon: '🦉'
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete habits on 10 different weekends',
    icon: '🎉'
  },

  // Consistency Badges
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete all habits for 7 days in a row',
    icon: '💎'
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Complete habits for 30 days without missing any',
    icon: '👑'
  },
  {
    id: 'daily-dedication',
    name: 'Daily Dedication',
    description: 'Complete at least one habit every day for 30 days',
    icon: '🔄'
  },

  // Special Achievement Badges
  {
    id: 'comeback-story',
    name: 'Comeback Story',
    description: 'Restart a habit after a 7+ day break',
    icon: '🔄'
  },
  {
    id: 'habit-sharer',
    name: 'Habit Sharer',
    description: 'Make your profile public and share progress',
    icon: '🤝'
  },
  {
    id: 'goal-crusher',
    name: 'Goal Crusher',
    description: 'Complete 90% of your weekly habit goals',
    icon: '🎯'
  },
  {
    id: 'zen-master',
    name: 'Zen Master',
    description: 'Maintain a 30-day meditation streak',
    icon: '☯️'
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
      let earnedAtISO: string;
      try {
        earnedAtISO = earnedAt && !isNaN(earnedAt.getTime()) ? earnedAt.toISOString() : now.toISOString();
      } catch (error) {
        console.warn('Invalid date for badge:', badgeId, earnedAt);
        earnedAtISO = now.toISOString();
      }
      
      earnedBadges.push({
        ...badge,
        earned: true,
        earnedAt: earnedAtISO
      });
    }
  };

  // Getting Started - Created first habit
  if (habits.length > 0) {
    const firstHabit = habits.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA.getTime() - dateB.getTime();
    })[0];
    
    const createdDate = new Date(firstHabit.createdAt || Date.now());
    if (!isNaN(createdDate.getTime())) {
      addBadge('first-habit', createdDate);
    } else {
      addBadge('first-habit'); // Use current time as fallback
    }
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