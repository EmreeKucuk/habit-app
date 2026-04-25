import React from 'react';
import { Flame, TrendingUp, Calendar } from 'lucide-react';
import { Habit } from '../types';

interface HighestStreakCardProps {
  habits: Habit[];
  isLoading?: boolean;
}

const HighestStreakCard: React.FC<HighestStreakCardProps> = ({ habits, isLoading }) => {
  const getHighestStreakHabit = () => {
    if (!habits || habits.length === 0) return null;
    
    return habits.reduce((highest, current) => {
      return current.streak > highest.streak ? current : highest;
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      health: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      sport: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      learning: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      productivity: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      mindfulness: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      social: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800',
      other: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "Great start! Keep it up!";
    if (streak < 7) return "Building momentum!";
    if (streak < 30) return "Strong habit forming!";
    if (streak < 100) return "Incredible consistency!";
    return "Habit master! 🏆";
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full">
        <div className="animate-pulse space-y-4 h-full flex flex-col">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const highestStreakHabit = getHighestStreakHabit();

  if (!highestStreakHabit) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Longest Streak
          </h3>
        </div>
        
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No habits yet. Create your first habit to start building streaks!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Longest Streak
        </h3>
      </div>
      
      <div className="space-y-4 flex-1 flex flex-col">
        {/* Habit Name */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
            {highestStreakHabit.name}
          </h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(highestStreakHabit.category)}`}>
            {highestStreakHabit.category}
          </span>
        </div>

        {/* Streak Display */}
        <div className="text-center py-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {highestStreakHabit.streak}
            </span>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
            {highestStreakHabit.streak === 1 ? 'day streak' : 'days streak'}
          </p>
        </div>

        {/* Encouragement Message */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            {getStreakMessage(highestStreakHabit.streak)}
          </p>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600 mt-auto">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{highestStreakHabit.frequency}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Best habit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighestStreakCard;