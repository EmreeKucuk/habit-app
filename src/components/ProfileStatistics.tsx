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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#A3B18A] dark:bg-gray-800/5 rounded-3xl p-5 border border-[#344E41] dark:border-gray-700/5 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-[#344E41] dark:bg-gray-700/10 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-[#344E41] dark:bg-gray-700/10 rounded w-1/2"></div>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-[#344E41] dark:bg-gray-700/10 rounded-2xl ml-3"></div>
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
      color: 'text-[#344E41] dark:text-gray-100',
      bgColor: 'bg-[#A3B18A] dark:bg-gray-800/20',
      suffix: ''
    },
    {
      icon: Calendar,
      label: 'Completed Today',
      value: stats.completedToday || 0,
      color: 'text-[#344E41] dark:text-gray-100',
      bgColor: 'bg-[#E9C46A] dark:bg-yellow-600/20',
      suffix: ''
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: stats.currentStreak || 0,
      color: 'text-[#344E41] dark:text-gray-100',
      bgColor: 'bg-[#344E41] dark:bg-gray-700/10',
      suffix: ' days'
    },
    {
      icon: Award,
      label: 'Longest Streak',
      value: stats.longestStreak || 0,
      color: 'text-[#344E41] dark:text-gray-100',
      bgColor: 'bg-[#A3B18A] dark:bg-gray-800/20',
      suffix: ' days'
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: Math.round(stats.successPercentage || 0),
      color: 'text-[#344E41] dark:text-gray-100',
      bgColor: 'bg-[#E9C46A] dark:bg-yellow-600/20',
      suffix: '%'
    },
    {
      icon: BarChart3,
      label: 'Total Completions',
      value: stats.totalCompletions || 0,
      color: 'text-[#344E41] dark:text-gray-100',
      bgColor: 'bg-[#344E41] dark:bg-gray-700/10',
      suffix: ''
    }
  ];

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-[#FEFAE0] dark:bg-gray-900 rounded-3xl shadow-[0_4px_20px_rgb(52,78,65,0.05)] border border-[#344E41] dark:border-gray-700/5 p-5 hover:shadow-[0_8px_30px_rgb(52,78,65,0.08)] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#344E41] dark:text-gray-100 opacity-70 uppercase tracking-wider mb-1.5 truncate">
                  {item.label}
                </p>
                <p className="text-2xl font-black text-[#344E41] dark:text-gray-100">
                  {item.value.toLocaleString()}
                  <span className="text-sm font-bold text-[#344E41] dark:text-gray-100 opacity-60 ml-1">
                    {item.suffix}
                  </span>
                </p>
              </div>
              <div className={`flex-shrink-0 p-3 rounded-2xl ${item.bgColor} ml-3 shadow-sm`}>
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
        className="bg-[#A3B18A] dark:bg-gray-800/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-[#344E41] dark:text-gray-100">
            Weekly Performance
          </h3>
          <div className="text-sm font-bold text-[#344E41] dark:text-gray-100 opacity-70">
            Average: {(stats.weeklyAverage || 0).toFixed(1)} completions/day
          </div>
        </div>
        
        <div className="w-full bg-[#344E41] dark:bg-gray-700/10 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((stats.weeklyAverage || 0) / 10) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.8 }}
            className="bg-gradient-to-r from-[#A3B18A] to-[#E9C46A] h-3 rounded-full shadow-sm"
          />
        </div>
        
        <p className="text-xs font-bold text-[#344E41] dark:text-gray-100 opacity-60 mt-3">
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