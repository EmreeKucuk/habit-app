import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Search, TrendingUp, Calendar, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { habitsApi } from '../services/api';
import { Habit, HabitCategory, SortType, FilterType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import HabitCard from '../components/HabitCard';
import LoadingSpinner from '../components/LoadingSpinner';

// Helper function to calculate streak
function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let currentDate = new Date(today);

  for (const dateStr of sortedDates) {
    const completionDate = new Date(dateStr);
    const dayDiff = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dayDiff === streak + 1 && streak === 0) {
      // Today not completed but yesterday was
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<{
    category: HabitCategory | 'all';
    status: FilterType;
    search: string;
  }>({
    category: 'all',
    status: 'all',
    search: '',
  });
  
  const [sorting, setSorting] = useState<{
    field: SortType;
    order: 'asc' | 'desc';
  }>({
    field: 'created',
    order: 'desc',
  });

  const [loadingHabitId, setLoadingHabitId] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  // Fetch habits
  const { data: habitsData, isLoading, error } = useQuery({
    queryKey: ['habits', filters.category !== 'all' ? filters.category : undefined, sorting.field, sorting.order],
    queryFn: async () => {
      console.log('🔍 Fetching habits from server...');
      const result = await habitsApi.getAll({
        category: filters.category !== 'all' ? filters.category : undefined,
        sort: sorting.field === 'created' ? 'created_at' : sorting.field,
        order: sorting.order,
      });
      console.log('📥 Received habits data:', result);
      if (result.habits && result.habits.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        result.habits.forEach(habit => {
          const isCompletedToday = habit.completedDates.includes(today);
          console.log(`📋 Habit "${habit.name}": completed today? ${isCompletedToday}, dates:`, habit.completedDates);
        });
      }
      return result;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Complete habit mutation
  const completeHabitMutation = useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data?: any }) => 
      habitsApi.complete(habitId, data),
    onMutate: async ({ habitId }) => {
      console.log('🔄 Starting optimistic update for habit:', habitId);
      setLoadingHabitId(habitId);
      
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      // Snapshot the previous value
      const queryKey = ['habits', filters.category !== 'all' ? filters.category : undefined, sorting.field, sorting.order];
      const previousHabits = queryClient.getQueryData(queryKey);

      // Store the snapshot but DON'T do optimistic update yet
      // We'll wait for the server response to know what actually happened
      console.log('📸 Snapshot taken, waiting for server response...');

      // Return a context object with the snapshotted value
      return { previousHabits, queryKey };
    },
    onSuccess: (data, { habitId }, context) => {
      console.log('🎉 Habit completion successful:', data);
      console.log('📊 Backend says completed:', data.completed);
      setLoadingHabitId(null);
      
      // Update the cache based on the actual backend response
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, (old: any) => {
          if (!old?.habits) return old;

          const today = new Date().toISOString().split('T')[0];
          const updatedHabits = old.habits.map((habit: Habit) => {
            if (habit.id === habitId) {
              let newCompletedDates: string[];
              
              if (data.completed) {
                // Backend says it's completed - ensure today is in the array
                newCompletedDates = habit.completedDates.includes(today) 
                  ? habit.completedDates 
                  : [...habit.completedDates, today].sort();
                console.log('✅ Backend confirms completion, final dates:', newCompletedDates);
              } else {
                // Backend says it's not completed - ensure today is NOT in the array
                newCompletedDates = habit.completedDates.filter(date => date !== today);
                console.log('❌ Backend confirms un-completion, final dates:', newCompletedDates);
              }

              // Recalculate streak based on actual completion dates
              const newStreak = calculateStreak(newCompletedDates);
              console.log('🔥 Final streak calculated:', newStreak);

              return {
                ...habit,
                completedDates: newCompletedDates,
                streak: newStreak
              };
            }
            return habit;
          });

          console.log('✅ Cache updated with server response');
          return { ...old, habits: updatedHabits };
        });
      }
      
      // Show XP gain notification if applicable
      if (data.xpGained && user) {
        console.log(`Gained ${data.xpGained} XP!`);
      }
    },
    onError: (error, { habitId: _habitId }, context) => {
      console.error('❌ Habit completion failed:', error);
      setLoadingHabitId(null);
      
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHabits && context?.queryKey) {
        console.log('🔙 Rolling back to previous state');
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
    },
    onSettled: () => {
      setLoadingHabitId(null);
      // Don't invalidate - our manual cache update is authoritative
      console.log('✅ Mutation settled, cache is up to date');
    },
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: (habitId: string) => habitsApi.delete(habitId),
    onMutate: async (habitId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData(['habits', filters.category !== 'all' ? filters.category : undefined, sorting.field, sorting.order]);

      // Optimistically remove the habit
      queryClient.setQueryData(['habits', filters.category !== 'all' ? filters.category : undefined, sorting.field, sorting.order], (old: any) => {
        if (!old?.habits) return old;

        const updatedHabits = old.habits.filter((habit: Habit) => habit.id !== habitId);
        return { ...old, habits: updatedHabits };
      });

      return { previousHabits };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error, _variables, context) => {
      console.error('Delete habit failed:', error);
      
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits', filters.category !== 'all' ? filters.category : undefined, sorting.field, sorting.order], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  // Filter and sort habits
  const filteredHabits = React.useMemo(() => {
    if (!habitsData?.habits) return [];

    let filtered = habitsData.habits;

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(habit =>
        habit.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        habit.notes?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      
      if (filters.status === 'completed') {
        filtered = filtered.filter(habit => 
          habit.completedDates.includes(today)
        );
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(habit => 
          !habit.completedDates.includes(today)
        );
      }
    }

    return filtered;
  }, [habitsData?.habits, filters]);

  const handleCompleteHabit = (habitId: string) => {
    console.log('🎯 Starting habit completion for:', habitId);
    console.log('🔍 Current user:', user?.id);
    console.log('🔍 Mutation status:', completeHabitMutation.status);
    
    completeHabitMutation.mutate(
      { habitId, data: {} }, // Always provide data object
      {
        onError: (error: any) => {
          console.error('❌ Completion failed:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
        }
      }
    );
  };

  const handleDeleteHabit = (habitId: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      deleteHabitMutation.mutate(habitId);
    }
  };

  const getTodayStats = () => {
    if (!habitsData?.habits) return { completed: 0, total: 0, percentage: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const dailyHabits = habitsData.habits.filter(h => h.frequency === 'daily');
    const completedToday = dailyHabits.filter(h => h.completedDates.includes(today));
    
    return {
      completed: completedToday.length,
      total: dailyHabits.length,
      percentage: dailyHabits.length > 0 ? Math.round((completedToday.length / dailyHabits.length) * 100) : 0,
    };
  };

  const todayStats = getTodayStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">Failed to load habits. Please try again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.username}!</h1>
              <p className="text-primary-100">Here's your habit progress for today</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{user?.xp} XP</div>
              <div className="text-primary-200">Level {user?.level}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{todayStats.completed}/{todayStats.total}</div>
                  <div className="text-primary-200">Today's Progress</div>
                </div>
                <Calendar className="h-8 w-8 text-primary-200" />
              </div>
              <div className="mt-2 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${todayStats.percentage}%` }}
                />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{habitsData?.habits?.length || 0}</div>
                  <div className="text-primary-200">Total Habits</div>
                </div>
                <TrendingUp className="h-8 w-8 text-primary-200" />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {Math.max(...(habitsData?.habits?.map(h => h.streak) || [0]))}
                  </div>
                  <div className="text-primary-200">Best Streak</div>
                </div>
                <Flame className="h-8 w-8 text-primary-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search habits..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="input-field pl-10 w-full sm:w-64"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {/* Sort */}
            <select
              value={`${sorting.field}-${sorting.order}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSorting({ field: field as SortType, order: order as 'asc' | 'desc' });
              }}
              className="input-field"
            >
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="streak-desc">Highest Streak</option>
              <option value="streak-asc">Lowest Streak</option>
            </select>
          </div>

          <Link to="/add-habit" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Habit
          </Link>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card"
            >
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as HabitCategory | 'all' }))}
                    className="input-field"
                  >
                    <option value="all">All Categories</option>
                    <option value="health">Health</option>
                    <option value="sport">Sport</option>
                    <option value="learning">Learning</option>
                    <option value="productivity">Productivity</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterType }))}
                    className="input-field"
                  >
                    <option value="all">All Habits</option>
                    <option value="completed">Completed Today</option>
                    <option value="pending">Pending Today</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Habits Grid */}
        {filteredHabits.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {filters.search || filters.status !== 'all' || filters.category !== 'all' 
                ? 'No habits match your filters' 
                : 'No habits yet'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filters.search || filters.status !== 'all' || filters.category !== 'all'
                ? 'Try adjusting your filters to see more habits.'
                : 'Start building healthy habits today!'
              }
            </p>
            {(!filters.search && filters.status === 'all' && filters.category === 'all') && (
              <Link to="/add-habit" className="btn-primary">
                Create Your First Habit
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredHabits.map((habit) => (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <HabitCard
                    habit={habit}
                    onComplete={() => handleCompleteHabit(habit.id)}
                    onDelete={() => handleDeleteHabit(habit.id)}
                    isLoading={loadingHabitId === habit.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
