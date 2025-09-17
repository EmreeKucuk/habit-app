import React from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Trash2, MessageCircle, Calendar } from 'lucide-react';
import { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onComplete, onDelete, isLoading }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completedDates.includes(today);
  
  const getCategoryColor = (category: string) => {
    const colors = {
      health: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      sport: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      learning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      productivity: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      mindfulness: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      social: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStreakDisplay = () => {
    if (habit.streak === 0) {
      return (
        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
          <Flame className="w-4 h-4" />
          <span className="text-sm">No streak yet</span>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold shadow-lg ${
          habit.streak >= 7 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse'
            : habit.streak >= 3
            ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
            : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
        }`}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Flame className="w-4 h-4" />
        </motion.div>
        <span>
          {habit.streak === 1 ? '1 day streak!' : `${habit.streak} days streak!`}
        </span>
        {habit.streak >= 7 && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-xs"
          >
            🔥
          </motion.span>
        )}
      </motion.div>
    );
  };

  const getProgress = () => {
    if (habit.frequency === 'daily') {
      return isCompletedToday ? 100 : 0;
    }
    
    // For weekly habits, calculate based on this week's completions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const thisWeekCompletions = habit.completedDates.filter(date => {
      const completionDate = new Date(date);
      return completionDate >= weekStart;
    }).length;
    
    return Math.min((thisWeekCompletions / 7) * 100, 100);
  };

  const progress = getProgress();

  return (
    <motion.div
      layout
      className="card hover:shadow-lg transition-all duration-300 group"
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {habit.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(habit.category)}`}>
              {habit.category}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {habit.frequency}
            </span>
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Notes */}
      {habit.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {habit.notes}
        </p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Streak Display */}
      <div className="mb-4">
        {getStreakDisplay()}
      </div>

      {/* Last completion */}
      {habit.completedDates.length > 0 && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <Calendar className="w-3 h-3" />
          <span>
            Last completed: {new Date(habit.completedDates[habit.completedDates.length - 1]).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Recent comments */}
      {habit.comments && habit.comments.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <MessageCircle className="w-3 h-3" />
            <span>Latest note</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-1">
            "{habit.comments[habit.comments.length - 1].text}"
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={onComplete}
          disabled={isLoading}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isCompletedToday
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Check className="w-4 h-4" />
          <span>
            {isCompletedToday ? 'Completed' : 'Complete'}
          </span>
        </motion.button>

        {isCompletedToday && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-green-500"
          >
            <Check className="w-6 h-6" />
          </motion.div>
        )}
      </div>

      {/* Completion animation */}
      {isCompletedToday && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center opacity-20">
            <Check className="w-8 h-8 text-white" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HabitCard;
