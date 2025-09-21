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
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categoryConfig = {
    health: { icon: Heart, color: 'bg-red-500', name: 'Health' },
    sport: { icon: Dumbbell, color: 'bg-orange-500', name: 'Sport' },
    learning: { icon: BookOpen, color: 'bg-purple-500', name: 'Learning' },
    productivity: { icon: Zap, color: 'bg-green-500', name: 'Productivity' },
    mindfulness: { icon: Brain, color: 'bg-blue-500', name: 'Mindfulness' },
    social: { icon: Users, color: 'bg-yellow-500', name: 'Social' },
    other: { icon: MoreHorizontal, color: 'bg-gray-500', name: 'Other' }
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
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Category Activity
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            No habit data available yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Category Activity
          </h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
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
              <div className={`p-2 rounded-lg ${config.color} bg-opacity-10`}>
                <Icon className={`h-4 w-4 text-white`} style={{
                  filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
                }} />
              </div>
              
              {/* Category Name */}
              <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                {config.name}
              </div>
              
              {/* Progress Bar */}
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  className={`h-full ${config.color} rounded-full`}
                />
              </div>
              
              {/* Count and Percentage */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {count}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
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
          className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Most Active Category
            </span>
            <div className="flex items-center space-x-2">
              {(() => {
                const [topCategory] = sortedCategories[0];
                const config = categoryConfig[topCategory as HabitCategory];
                const Icon = config.icon;
                return (
                  <>
                    <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
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