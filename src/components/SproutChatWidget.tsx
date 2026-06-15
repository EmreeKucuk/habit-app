import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/api';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'sprout';
  timestamp: Date;
  habitCompleted?: string | null; // Name of the auto-completed habit
}

const SproutChatWidget: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a greeting when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            id: 'msg-1',
            text: `Hi ${user?.username || 'there'}! 🌱 I'm Sprout. Tell me how your habits are going today!`,
            sender: 'sprout',
            timestamp: new Date()
          }
        ]);
        setIsTyping(false);
      }, 1000);
    }
  }, [isOpen, messages.length, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await chatApi.send(messageText);

      // Log difficulty_score for debugging
      console.log(`[Sprout] difficulty_score: ${response.difficulty_score}`);
      console.log(`[Sprout] completed_habit_id: ${response.completed_habit_id}`);

      const sproutResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        text: response.reply,
        sender: 'sprout',
        timestamp: new Date(),
        habitCompleted: response.habit_completion?.habitName || null,
      };

      setMessages(prev => [...prev, sproutResponse]);

      // If a habit was auto-completed, refresh dashboard data
      if (response.completed_habit_id && response.habit_completion?.success) {
        console.log(`[Sprout] ✅ Auto-completed habit: "${response.habit_completion.habitName}"`);

        // Invalidate React Query caches so Dashboard, Heatmap, etc. re-render
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });

        // Update XP in auth context if XP was gained
        if (response.habit_completion.xpGained && response.habit_completion.xpGained > 0 && user) {
          const newXP = (user.xp || 0) + response.habit_completion.xpGained;
          const newLevel = Math.floor(newXP / 100) + 1;
          updateUser({ ...user, xp: newXP, level: newLevel });
        }
      }
    } catch (error) {
      console.error('[Sprout] Chat API error:', error);

      const errorResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        text: "I'm having a little trouble connecting right now, but I believe in you! 🌱",
        sender: 'sprout',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAvatar = (username: string, color: string) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-[#344E41] dark:bg-gray-700 text-[#FEFAE0] dark:text-gray-300 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Open Sprout Chat"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E9C46A] dark:bg-yellow-600 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E9C46A] dark:bg-yellow-600"></span>
        </span>
      </motion.button>

      {/* Slide-out Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#344E41] dark:bg-gray-700/20 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#FEFAE0] dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 bg-[#A3B18A] dark:bg-gray-800 border-b border-[#344E41] dark:border-gray-700/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#FEFAE0] dark:bg-gray-900 flex items-center justify-center shadow-sm">
                    <span className="text-xl">🌱</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-[#344E41] dark:text-gray-100 text-lg leading-tight">Sprout</h2>
                    <p className="text-xs text-[#344E41] dark:text-gray-100 opacity-70 font-medium">Your Habit Companion</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#344E41] dark:text-gray-100 hover:bg-[#FEFAE0] dark:bg-gray-900/50 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg) => {
                  const isSprout = msg.sender === 'sprout';
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isSprout ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex max-w-[85%] ${isSprout ? 'flex-row' : 'flex-row-reverse'}`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 ${isSprout ? 'mr-3' : 'ml-3'}`}>
                          {isSprout ? (
                            <div className="w-8 h-8 rounded-full bg-[#A3B18A] dark:bg-gray-800 flex items-center justify-center">
                              <span className="text-sm">🌱</span>
                            </div>
                          ) : (
                            <img
                              src={generateAvatar(user?.username || 'U', user?.avatarColor || '#E9C46A')}
                              alt="You"
                              className="w-8 h-8 rounded-full border border-[#344E41] dark:border-gray-700/10"
                            />
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div>
                          <div
                            className={`p-3 rounded-2xl ${
                              isSprout
                                ? 'bg-white text-[#344E41] dark:text-gray-100 rounded-tl-none border border-[#344E41] dark:border-gray-700/5 shadow-sm'
                                : 'bg-[#344E41] dark:bg-gray-700 text-[#FEFAE0] dark:text-gray-300 rounded-tr-none shadow-md'
                            }`}
                          >
                            <p className="text-[15px] leading-relaxed">{msg.text}</p>
                          </div>
                          {/* Auto-completion badge */}
                          {msg.habitCompleted && (
                            <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-[#344E41] dark:bg-gray-700/10 rounded-full w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#344E41] dark:text-gray-100" />
                              <span className="text-[11px] font-semibold text-[#344E41] dark:text-gray-100">
                                ✅ Marked "{msg.habitCompleted}" as done
                              </span>
                            </div>
                          )}
                          <p className={`text-[10px] mt-1 text-[#344E41] dark:text-gray-100 opacity-50 ${isSprout ? 'text-left' : 'text-right'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex w-full justify-start">
                    <div className="flex max-w-[85%] flex-row">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-[#A3B18A] dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-sm">🌱</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-none border border-[#344E41] dark:border-gray-700/5 shadow-sm px-4 py-3 flex items-center space-x-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-2 h-2 bg-[#A3B18A] dark:bg-gray-800 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-2 h-2 bg-[#A3B18A] dark:bg-gray-800 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="w-2 h-2 bg-[#A3B18A] dark:bg-gray-800 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-[#344E41] dark:border-gray-700/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Tell Sprout about your habits..."
                    className="flex-1 max-h-32 min-h-[44px] bg-[#FEFAE0] dark:bg-gray-900/50 border border-[#A3B18A]/50 focus:border-[#A3B18A] focus:ring-1 focus:ring-[#A3B18A] rounded-2xl px-4 py-3 text-[#344E41] dark:text-gray-100 placeholder-[#344E41]/40 resize-none outline-none transition-all"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="w-11 h-11 rounded-full bg-[#E9C46A] dark:bg-yellow-600 text-[#344E41] dark:text-gray-100 flex items-center justify-center flex-shrink-0 hover:bg-[#e6bb53] transition-colors disabled:opacity-50 disabled:hover:bg-[#E9C46A] dark:bg-yellow-600"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SproutChatWidget;
