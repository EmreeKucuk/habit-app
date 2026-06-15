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
    // simplified Zen badge styling
    return 'bg-[#344E41] dark:bg-gray-700/5 text-[#344E41] dark:text-gray-100 border-none opacity-80 font-bold uppercase tracking-wider px-3 py-1 rounded-xl';
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
      <div className="bg-[#A3B18A] dark:bg-gray-800/5 rounded-3xl p-8 h-full flex flex-col">
        <div className="animate-pulse space-y-4 h-full flex flex-col">
          <div className="h-6 bg-[#344E41] dark:bg-gray-700/10 rounded-lg w-3/4 mb-4"></div>
          <div className="space-y-4 flex-1">
            <div className="h-4 bg-[#344E41] dark:bg-gray-700/10 rounded-lg w-full"></div>
            <div className="h-4 bg-[#344E41] dark:bg-gray-700/10 rounded-lg w-2/3"></div>
            <div className="h-24 bg-[#344E41] dark:bg-gray-700/10 rounded-2xl w-full my-6"></div>
            <div className="h-4 bg-[#344E41] dark:bg-gray-700/10 rounded-lg w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const highestStreakHabit = getHighestStreakHabit();

  if (!highestStreakHabit) {
    return (
      <div className="bg-[#FEFAE0] dark:bg-gray-900 rounded-3xl shadow-[0_4px_20px_rgb(52,78,65,0.05)] border border-[#344E41] dark:border-gray-700/5 p-8 h-full flex flex-col">
        <div className="flex items-center space-x-3 mb-6">
          <Flame className="w-6 h-6 text-[#E9C46A]" />
          <h3 className="text-xl font-black text-[#344E41] dark:text-gray-100 tracking-tight">
            Longest Streak
          </h3>
        </div>
        
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <TrendingUp className="w-14 h-14 text-[#344E41] dark:text-gray-100 opacity-20 mx-auto mb-4" />
          <p className="text-[#344E41] dark:text-gray-100 opacity-60 font-bold text-sm">
            No habits yet. Create your first habit to start building streaks!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FEFAE0] dark:bg-gray-900 rounded-3xl shadow-[0_4px_20px_rgb(52,78,65,0.05)] border border-[#344E41] dark:border-gray-700/5 p-8 h-full flex flex-col hover:shadow-[0_8px_30px_rgb(52,78,65,0.08)] transition-all">
      <div className="flex items-center space-x-3 mb-6">
        <Flame className="w-6 h-6 text-[#E9C46A]" />
        <h3 className="text-xl font-black text-[#344E41] dark:text-gray-100 tracking-tight">
          Longest Streak
        </h3>
      </div>
      
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Habit Name */}
        <div>
          <h4 className="font-black text-[#344E41] dark:text-gray-100 text-lg mb-3 truncate">
            {highestStreakHabit.name}
          </h4>
          <span className={`inline-flex items-center text-xs ${getCategoryColor(highestStreakHabit.category)}`}>
            {highestStreakHabit.category}
          </span>
        </div>

        {/* Streak Display */}
        <div className="text-center py-6 bg-[#E9C46A] dark:bg-yellow-600/10 rounded-3xl border border-[#E9C46A]/40 flex-1 flex flex-col justify-center shadow-[0_4px_20px_rgb(52,78,65,0.03)] hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Flame className="w-8 h-8 text-[#E9C46A]" />
            <span className="text-5xl font-black text-[#344E41] dark:text-gray-100">
              {highestStreakHabit.streak}
            </span>
          </div>
          <p className="text-xs font-bold text-[#344E41] dark:text-gray-100 opacity-80 uppercase tracking-wider mt-1">
            {highestStreakHabit.streak === 1 ? 'day streak' : 'days streak'}
          </p>
        </div>

        {/* Encouragement Message */}
        <div className="text-center py-2">
          <p className="text-sm font-medium text-[#344E41] dark:text-gray-100 opacity-60 italic">
            {getStreakMessage(highestStreakHabit.streak)}
          </p>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs font-bold text-[#344E41] dark:text-gray-100 opacity-50 pt-4 border-t border-[#344E41] dark:border-gray-700/10 mt-auto uppercase tracking-wider">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{highestStreakHabit.frequency}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Best habit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighestStreakCard;