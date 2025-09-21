import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Calendar, Flame, Award, BarChart3 } from 'lucide-react';
import { ProfileStats } from '../types';

interface ProfileStatisticsProps {
  stats?: ProfileStats;
  isLoading?: boolean;
}

const ProfileStatistics: React.FC<ProfileStatisticsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg ml-3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: Target,
      label: 'Total Habits',
      value: stats.totalHabits || 0,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      suffix: ''
    },
    {
      icon: Calendar,
      label: 'Completed Today',
      value: stats.completedToday || 0,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      suffix: ''
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: stats.currentStreak || 0,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      suffix: ' days'
    },
    {
      icon: Award,
      label: 'Longest Streak',
      value: stats.longestStreak || 0,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      suffix: ' days'
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: Math.round(stats.successPercentage || 0),
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
      suffix: '%'
    },
    {
      icon: BarChart3,
      label: 'Total Completions',
      value: stats.totalCompletions || 0,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      suffix: ''
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Statistics
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {item.value.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {item.suffix}
                  </span>
                </p>
              </div>
              <div className={`flex-shrink-0 p-3 rounded-lg ${item.bgColor} ml-3`}>
                <item.icon className={`h-6 w-6 ${item.color}`} style={{ minWidth: '24px', minHeight: '24px' }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly Average */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Weekly Performance
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Average: {(stats.weeklyAverage || 0).toFixed(1)} completions/day
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((stats.weeklyAverage || 0) / 10) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.8 }}
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
          />
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {(stats.weeklyAverage || 0) >= 7 ? 'Excellent performance!' : 
           (stats.weeklyAverage || 0) >= 5 ? 'Good progress!' : 
           (stats.weeklyAverage || 0) >= 3 ? 'Keep it up!' : 
           'Room for improvement'}
        </p>
      </motion.div>
    </div>
  );
};

export default ProfileStatistics;