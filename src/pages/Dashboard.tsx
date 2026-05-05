import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Flame, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { habitsApi } from '../services/api';
import { Habit } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import HabitCard from '../components/HabitCard';
import HabitDeletionModal from '../components/HabitDeletionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import CircularProgress from '../components/CircularProgress';
import Heatmap from '../components/Heatmap';

const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [loadingHabitId, setLoadingHabitId] = useState<string | null>(null);
  const [xpNotification, setXpNotification] = useState<{ xp: number; visible: boolean }>({ xp: 0, visible: false });
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  // Fetch habits
  const { data: habitsData, isLoading: habitsLoading, error: habitsError } = useQuery({
    queryKey: ['habits', 'all', 'created', 'desc'],
    queryFn: async () => {
      const result = await habitsApi.getAll({});
      return result;
    },
    refetchOnMount: true,
  });

  // Fetch stats (currentStreak, weeklyAverage)
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => habitsApi.client.get('/users/me/stats').then(res => res.data),
  });

  // Complete habit mutation
  const completeHabitMutation = useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data?: any }) => 
      habitsApi.complete(habitId, data),
    onMutate: async ({ habitId }) => {
      setLoadingHabitId(habitId);
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      const queryKey = ['habits', 'all', 'created', 'desc'];
      const previousHabits = queryClient.getQueryData(queryKey);

      if (previousHabits) {
        const today = new Date().toISOString().split('T')[0];
        
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.habits) return old;
          
          return {
            ...old,
            habits: old.habits.map((habit: any) => {
              if (habit.id === habitId) {
                const isAlreadyCompleted = habit.completedDates.includes(today);
                
                if (isAlreadyCompleted) {
                  return habit; // backend doesn't allow uncompleting here directly
                } else {
                  return {
                    ...habit,
                    completedDates: [...habit.completedDates, today],
                    streak: habit.streak + 1
                  };
                }
              }
              return habit;
            })
          };
        });
      }

      return { previousHabits, queryKey, habitId };
    },
    onSuccess: (data) => {
      setLoadingHabitId(null);
      
      if (data.xpGained && data.xpGained > 0 && user) {
        const newXP = user.xp + data.xpGained;
        const newLevel = Math.floor(newXP / 100) + 1;
        
        updateUser({
          ...user,
          xp: newXP,
          level: newLevel
        });
        
        setXpNotification({ xp: data.xpGained, visible: true });
        setTimeout(() => {
          setXpNotification(prev => ({ ...prev, visible: false }));
        }, 3000);
      }
      
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: (error, _vars, context) => {
      setLoadingHabitId(null);
      if (context?.previousHabits && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
    },
    onSettled: () => {
      setLoadingHabitId(null);
    },
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: (habitId: string) => habitsApi.delete(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });

  const handleCompleteHabit = (habitId: string) => {
    completeHabitMutation.mutate({ habitId, data: {} });
  };

  const confirmDeleteHabit = () => {
    if (habitToDelete) {
      deleteHabitMutation.mutate(habitToDelete.id);
      setHabitToDelete(null);
    }
  };

  // Calculations
  const habits = habitsData?.habits || [];
  const today = new Date().toISOString().split('T')[0];
  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.completedDates?.includes(today)).length;
  
  const bestStreak = userStats?.currentStreak || Math.max(0, ...habits.map((h) => h.streak || 0));

  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    habits.forEach((habit) => {
      (habit.completedDates || []).forEach((date) => {
        data[date] = (data[date] || 0) + 1;
      });
    });
    return data;
  }, [habits]);

  const getMotivationalMessage = (completed: number, total: number): string => {
    if (total === 0) return '🌱 Add your first habit to get started!';
    const ratio = completed / total;
    if (ratio === 1) return '🎉 Perfect day! All habits completed!';
    if (ratio >= 0.75) return '🔥 Almost there! Keep pushing!';
    if (ratio >= 0.5) return '💪 Halfway done, you got this!';
    if (ratio > 0) return '🌤️ Good start! Keep the momentum going!';
    return "☀️ Fresh day ahead — let's make it count!";
  };

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (habitsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  if (habitsError) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load habits. Please try again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* XP Notification */}
      <AnimatePresence>
        {xpNotification.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 bg-[#E9C46A] text-[#344E41] px-6 py-3 rounded-lg shadow-lg font-bold"
          >
            🎉 +{xpNotification.xp} XP Gained!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <h1 className="text-4xl font-black text-[#344E41] tracking-tight">{getGreeting()} 👋</h1>
          <p className="text-lg text-[#344E41] opacity-70 mt-1 font-medium">
            {user?.username ? `Hey ${user.username}, ` : ''}let's check your progress
          </p>
        </motion.div>

        {/* Top Section: Daily Overview (40%) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#A3B18A] rounded-[24px] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex-shrink-0">
            <CircularProgress 
              completed={completedToday} 
              total={totalHabits} 
              size={160} 
              strokeWidth={16} 
            />
          </div>

          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Streak */}
              <div className="bg-[#FEFAE0] rounded-2xl p-5 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-[#E9C46A]" />
                  <span className="text-xs font-bold text-[#344E41] opacity-60 tracking-wider">STREAK</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#344E41]">{bestStreak}</span>
                  <span className="text-sm font-semibold text-[#344E41] opacity-60">{bestStreak === 1 ? 'day' : 'days'}</span>
                </div>
              </div>

              {/* Weekly Average */}
              <div className="bg-[#FEFAE0] rounded-2xl p-5 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-[#E9C46A]" />
                  <span className="text-xs font-bold text-[#344E41] opacity-60 tracking-wider">WEEKLY</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#344E41]">{userStats?.weeklyAverage?.toFixed(1) || '0.0'}</span>
                  <span className="text-sm font-semibold text-[#344E41] opacity-60">avg/day</span>
                </div>
              </div>
            </div>
            
            {/* Motivation Bar */}
            <div className="bg-[#FEFAE0] bg-opacity-40 rounded-xl px-5 py-3 text-center">
              <span className="text-[#344E41] font-semibold tracking-wide text-sm">
                {getMotivationalMessage(completedToday, totalHabits)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Active Habits Scrollable Row */}
        {habits.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold text-[#344E41]">Active Habits</h2>
              <Link 
                to="/add-habit" 
                className="w-10 h-10 bg-[#344E41] rounded-full flex items-center justify-center text-[#FEFAE0] hover:bg-[#2a3f35] transition-colors hover:scale-105"
              >
                <Plus className="w-5 h-5" />
              </Link>
            </div>

            {/* Horizontal Scroll Area */}
            <div className="flex overflow-x-auto gap-4 pb-6 pt-2 px-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollPaddingLeft: '0.5rem' }}>
              {habits.map((habit) => (
                <div key={habit.id} className="min-w-[300px] w-[300px] max-w-[85vw] snap-start shrink-0">
                  <HabitCard
                    habit={habit}
                    onComplete={() => handleCompleteHabit(habit.id)}
                    onDelete={() => setHabitToDelete(habit)}
                    isLoading={loadingHabitId === habit.id}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {habits.length === 0 && (
          <div className="bg-[#A3B18A] bg-opacity-30 rounded-[24px] p-12 text-center flex flex-col items-center justify-center">
             <h3 className="text-xl font-bold text-[#344E41] mb-3">No habits active</h3>
             <p className="text-[#344E41] opacity-70 mb-6 font-medium">Start building your healthy routine today!</p>
             <Link to="/add-habit" className="bg-[#344E41] text-[#FEFAE0] px-6 py-3 rounded-xl font-bold hover:bg-[#2a3f35] transition-colors flex items-center gap-2 shadow-lg">
                <Plus className="w-5 h-5" />
                Create Habit
             </Link>
          </div>
        )}

        {/* Bottom Section: Activity Heatmap (60%) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-[#344E41]">Activity</h2>
            <div className="bg-[#A3B18A] bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold text-[#344E41]">
              {Object.values(heatmapData).reduce((a, b) => a + b, 0)} total
            </div>
          </div>
          
          <div className="bg-[#A3B18A] bg-opacity-20 rounded-[24px] p-6 pt-8 overflow-hidden">
            <Heatmap data={heatmapData} weeks={16} />
          </div>
        </motion.div>

      </div>

      <HabitDeletionModal
        habit={habitToDelete}
        isOpen={!!habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={confirmDeleteHabit}
        isLoading={deleteHabitMutation.isPending}
      />
    </Layout>
  );
};

export default Dashboard;
