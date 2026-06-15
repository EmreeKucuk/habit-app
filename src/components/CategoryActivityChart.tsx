import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Heart, Dumbbell, BookOpen, Zap, Brain, Users, MoreHorizontal } from 'lucide-react';
import { HabitCategory } from '../types';

interface CategoryActivityChartProps {
  categoryBreakdown: { [key in HabitCategory]?: number };
  isLoading?: boolean;
}

const CategoryActivityChart: React.FC<CategoryActivityChartProps> = ({ 
  categoryBreakdown, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-[#344E41] dark:bg-gray-700/10 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-5 w-5 bg-[#344E41] dark:bg-gray-700/10 rounded"></div>
              <div className="h-4 bg-[#344E41] dark:bg-gray-700/10 rounded w-20"></div>
              <div className="flex-1 h-3 bg-[#344E41] dark:bg-gray-700/10 rounded"></div>
              <div className="h-4 bg-[#344E41] dark:bg-gray-700/10 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const categoryConfig = {
    health: { icon: Heart, color: 'bg-[#E9C46A] dark:bg-yellow-600', name: 'Health' },
    sport: { icon: Dumbbell, color: 'bg-[#A3B18A] dark:bg-gray-800', name: 'Sport' },
    learning: { icon: BookOpen, color: 'bg-[#344E41] dark:bg-gray-700', name: 'Learning' },
    productivity: { icon: Zap, color: 'bg-[#E9C46A] dark:bg-yellow-600', name: 'Productivity' },
    mindfulness: { icon: Brain, color: 'bg-[#A3B18A] dark:bg-gray-800', name: 'Mindfulness' },
    social: { icon: Users, color: 'bg-[#E9C46A] dark:bg-yellow-600', name: 'Social' },
    other: { icon: MoreHorizontal, color: 'bg-[#344E41] dark:bg-gray-700', name: 'Other' }
  };

  // Calculate total for percentage calculations
  const total = Object.values(categoryBreakdown).reduce((sum, count) => sum + (count || 0), 0);
  
  // Sort categories by count (descending)
  const sortedCategories = Object.entries(categoryBreakdown)
    .filter(([_, count]) => count && count > 0)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .slice(0, 7); // Show top 7 categories

  if (total === 0) {
    return (
      <div className="text-center py-10 bg-[#A3B18A] dark:bg-gray-800/5 rounded-3xl border border-[#344E41] dark:border-gray-700/5">
        <div className="text-[#344E41] dark:text-gray-100 opacity-20 mb-3">
          <BarChart3 className="h-14 w-14 mx-auto" />
        </div>
        <p className="text-[#344E41] dark:text-gray-100 font-medium opacity-60">
          No habit data available yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#344E41] dark:text-gray-100 opacity-60 bg-[#A3B18A] dark:bg-gray-800/10 px-3 py-1 rounded-xl">
          Total: {total} habits
        </div>
      </div>

      <div className="space-y-4">
        {sortedCategories.map(([category, count], index) => {
          const config = categoryConfig[category as HabitCategory];
          const percentage = total > 0 ? ((count || 0) / total) * 100 : 0;
          const Icon = config.icon;
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center space-x-3"
            >
              {/* Category Icon */}
              <div className={`p-2 rounded-lg bg-[#344E41] dark:bg-gray-700/5`}>
                <Icon className={`h-4 w-4 ${config.color.replace('bg-', 'text-')}`} />
              </div>
              
              {/* Category Name */}
              <div className="w-24 text-sm font-bold text-[#344E41] dark:text-gray-100 opacity-80">
                {config.name}
              </div>
              
              {/* Progress Bar */}
              <div className="flex-1 bg-[#344E41] dark:bg-gray-700/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  className={`h-full ${config.color} rounded-full`}
                />
              </div>
              
              {/* Count and Percentage */}
              <div className="flex items-center space-x-2 text-sm w-16 justify-end">
                <span className="font-black text-[#344E41] dark:text-gray-100">
                  {count}
                </span>
                <span className="text-[#344E41] dark:text-gray-100 opacity-50 font-bold text-xs">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Most Active Category */}
      {sortedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-6 pt-5 border-t border-[#344E41] dark:border-gray-700/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#344E41] dark:text-gray-100 opacity-60">
              Most Active Category
            </span>
            <div className="flex items-center space-x-2">
              {(() => {
                const [topCategory] = sortedCategories[0];
                const config = categoryConfig[topCategory as HabitCategory];
                const Icon = config.icon;
                return (
                  <>
                    <Icon className={`h-4 w-4 ${config.color.replace('bg-', 'text-')}`} />
                    <span className="font-black text-[#344E41] dark:text-gray-100">
                      {config.name}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CategoryActivityChart;