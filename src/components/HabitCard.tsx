import React, { useState, useRef } from 'react';
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
  
  // Hold-to-complete state
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const HOLD_DURATION = 1200; // 1.2 seconds (shortened from 2 seconds)
  
  const startHold = () => {
    if (isLoading || isCompletedToday) return;
    
    setIsHolding(true);
    setHoldProgress(0);
    
    // Start progress animation
    const startTime = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
    }, 16); // ~60fps
    
    // Set timer for completion
    holdTimerRef.current = setTimeout(() => {
      onComplete();
      resetHold();
    }, HOLD_DURATION);
  };
  
  const resetHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };
  
  const handleMouseDown = () => startHold();
  const handleMouseUp = () => resetHold();
  const handleMouseLeave = () => resetHold();
  const handleTouchStart = () => startHold();
  const handleTouchEnd = () => resetHold();

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);
  
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
        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
          habit.streak >= 7 
            ? 'bg-[#E9C46A] text-[#344E41]'
            : habit.streak >= 3
            ? 'bg-[#A3B18A] text-[#FEFAE0]'
            : 'bg-[#344E41] text-[#FEFAE0] bg-opacity-10 !text-[#344E41]'
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
            className="text-xs ml-1"
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
      className="bg-[#FEFAE0] rounded-[20px] p-6 shadow-sm border border-[#344E41] border-opacity-10 hover:shadow-md transition-all duration-300 group flex flex-col h-full"
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-xl text-[#344E41] mb-2 group-hover:text-[#A3B18A] transition-colors line-clamp-1">
            {habit.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(habit.category)}`}>
              {habit.category}
            </span>
            <span className="text-xs font-semibold text-[#344E41] opacity-60 capitalize tracking-wider">
              {habit.frequency}
            </span>
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className="p-2 text-[#344E41] opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-all duration-200 rounded-full hover:bg-black/5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Notes */}
      {habit.notes && (
        <p className="text-sm text-[#344E41] opacity-70 mb-4 line-clamp-2">
          {habit.notes}
        </p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wider text-[#344E41] opacity-60 uppercase">Progress</span>
          <span className="text-sm font-bold text-[#344E41]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-[#344E41] bg-opacity-10 rounded-full h-1.5">
          <motion.div
            className="bg-[#A3B18A] h-1.5 rounded-full"
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
        <div className="flex items-center space-x-1.5 text-xs font-medium text-[#344E41] opacity-60 mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            Last completed: {(() => {
              const lastDate = habit.completedDates[habit.completedDates.length - 1];
              try {
                const date = new Date(lastDate);
                if (isNaN(date.getTime())) return 'Recently';
                return date.toLocaleDateString();
              } catch (error) {
                return 'Recently';
              }
            })()}
          </span>
        </div>
      )}

      {/* Spacer to push button to bottom */}
      <div className="flex-grow" />

      {/* Recent comments */}
      {habit.comments && habit.comments.length > 0 && (
        <div className="mb-4 bg-[#344E41] bg-opacity-5 rounded-lg p-3">
          <div className="flex items-center space-x-1 text-xs font-bold text-[#344E41] opacity-60 mb-1 tracking-wider uppercase">
            <MessageCircle className="w-3 h-3" />
            <span>Latest note</span>
          </div>
          <p className="text-sm text-[#344E41] italic line-clamp-2">
            "{habit.comments[habit.comments.length - 1].text}"
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto">
        <motion.button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className={`relative flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 overflow-hidden ${
            isCompletedToday
              ? 'bg-[#A3B18A] text-[#FEFAE0] shadow-md cursor-default'
              : 'bg-[#344E41] hover:bg-[#2a3f35] text-[#FEFAE0] shadow-md hover:shadow-lg cursor-pointer select-none'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {/* Progress bar background */}
          {isHolding && !isCompletedToday && (
            <motion.div
              className="absolute inset-0 bg-[#E9C46A] opacity-20"
              initial={{ width: 0 }}
              animate={{ width: `${holdProgress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
              style={{ left: 0, top: 0, height: "100%" }}
            />
          )}
          
          <Check className="w-4 h-4 relative z-10" />
          <span className="relative z-10">
            {isCompletedToday 
              ? 'Completed ✓' 
              : isHolding 
                ? `Hold to complete...` 
                : 'Hold to Complete'
            }
          </span>
          
          {/* Progress indicator */}
          {isHolding && !isCompletedToday && (
            <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-white/30 rounded-full z-10">
              <motion.div
                className="w-full h-full bg-[#E9C46A] rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: holdProgress / 100 }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          )}
        </motion.button>

        {isCompletedToday && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-[#344E41] bg-[#A3B18A] bg-opacity-20 rounded-full p-2 ml-3"
          >
            <Check className="w-6 h-6" />
          </motion.div>
        )}
      </div>

      {/* Completion animation */}
      {isCompletedToday && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.1, 1], 
            opacity: [0, 0.2, 0.1]
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
