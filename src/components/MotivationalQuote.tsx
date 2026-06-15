import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, RefreshCw } from 'lucide-react';
import { getDailyQuote, getRandomQuote } from '../utils/quotes';
import { MotivationalQuote } from '../types';

interface MotivationalQuoteComponentProps {
  className?: string;
}

const MotivationalQuoteComponent: React.FC<MotivationalQuoteComponentProps> = ({ 
  className = '' 
}) => {
  const [quote, setQuote] = useState<MotivationalQuote>(getDailyQuote());
  const [isDaily, setIsDaily] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Add a small delay for better UX
    setTimeout(() => {
      setQuote(getRandomQuote());
      setIsDaily(false);
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative p-6 bg-[#344E41] dark:bg-gray-800 text-[#FEFAE0] dark:text-gray-200 h-full min-h-[200px] flex flex-col ${className}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Quote className="h-6 w-6 text-[#A3B18A]" />
          <h2 className="text-lg font-semibold">
            {isDaily ? "Today's Motivation" : "Random Inspiration"}
          </h2>
        </div>
        
        <motion.button
          onClick={handleRefresh}
          disabled={isRefreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw 
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </motion.button>
      </div>

      <motion.div
        key={quote.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col justify-center"
      >
        <blockquote className="text-lg font-medium mb-6 leading-relaxed flex-1 flex items-center">
          <span>"{quote.text}"</span>
        </blockquote>
        
        <div className="flex items-center justify-between mt-auto">
          <cite className="text-[#A3B18A] font-bold">
            — {quote.author}
          </cite>
          
          <div className="flex items-center space-x-2 text-xs font-bold text-[#A3B18A]">
            <span className="px-2 py-1 bg-white/10 rounded-xl uppercase tracking-wider">
              {isDaily ? 'Daily Quote' : 'Random Quote'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="absolute inset-0 bg-white rounded-full transform translate-x-16 -translate-y-16" />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
        <div className="absolute inset-0 bg-white rounded-full transform -translate-x-12 translate-y-12" />
      </div>
    </motion.div>
  );
};

export default MotivationalQuoteComponent;