import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Heart, Flame, X } from 'lucide-react';
import { Habit } from '../types';

interface HabitDeletionModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const HabitDeletionModal: React.FC<HabitDeletionModalProps> = ({
  habit,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  if (!habit) return null;

  const getMotivationalMessage = () => {
    const streak = habit.streak;
    const totalCompletions = habit.completedDates.length;
    
    if (streak >= 30) {
      return `You've built an incredible ${streak}-day streak! That's months of dedication and growth. All that progress will be lost forever.`;
    } else if (streak >= 7) {
      return `Your ${streak}-day streak represents real commitment and positive change. Don't let this momentum slip away.`;
    } else if (totalCompletions > 0) {
      return `You've completed this habit ${totalCompletions} time${totalCompletions > 1 ? 's' : ''}. Every completion was a step toward becoming better.`;
    } else {
      return `This habit represents a goal you set for yourself. Sometimes the first step is the hardest - are you sure you want to give up?`;
    }
  };

  const getRegretMessage = () => {
    const messages = [
      "Remember: habits are the compound interest of self-improvement. Small consistent actions lead to remarkable results.",
      "What if instead of deleting, you modified this habit to make it easier or more enjoyable?",
      "Many successful people had moments of doubt but pushed through. This could be your breakthrough moment.",
      "Progress isn't always linear. Bad days don't erase the good ones you've had.",
      "Consider putting this habit on pause instead of deleting it completely."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Delete Habit?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Habit Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: habit.color }}
                  >
                    {habit.icon || '📝'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {habit.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {habit.category} • {habit.frequency}
                    </p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1 text-orange-500 mb-1">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold text-lg">{habit.streak}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Day Streak</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1 text-blue-500 mb-1">
                      <Heart className="w-4 h-4" />
                      <span className="font-bold text-lg">{habit.completedDates.length}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Completions</p>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  💭 Before you decide...
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  {getMotivationalMessage()}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400 italic">
                  {getRegretMessage()}
                </p>
              </div>

              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>⚠️ This will permanently delete:</strong>
                </p>
                <ul className="text-sm text-red-600 dark:text-red-400 mt-2 space-y-1">
                  <li>• All completion history ({habit.completedDates.length} records)</li>
                  <li>• Your {habit.streak}-day streak</li>
                  <li>• Any notes and progress data</li>
                  <li>• This habit configuration</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex space-x-3 p-6 pt-0">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Keep This Habit
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HabitDeletionModal;