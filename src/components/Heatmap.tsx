import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapProps {
  data: Record<string, number>;
  weeks?: number;
}

const Heatmap: React.FC<HeatmapProps> = ({ data, weeks = 18 }) => {
  // Generate days based on weeks
  const { days, monthLabels } = useMemo(() => {
    const today = new Date();
    // Round to end of the week (Saturday)
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay();
    const daysToSaturday = 6 - dayOfWeek;
    endDate.setDate(endDate.getDate() + daysToSaturday);

    // Calculate start date
    const daysToGenerate = weeks * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - daysToGenerate + 1);

    const generatedDays: { date: string; value: number; isFuture: boolean }[] = [];
    const generatedMonthLabels: { month: string; index: number }[] = [];
    
    let currentMonth = -1;

    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Check for month label
      if (d.getMonth() !== currentMonth && i < daysToGenerate - 7) {
        generatedMonthLabels.push({
          month: d.toLocaleString('default', { month: 'short' }),
          index: Math.floor(i / 7)
        });
        currentMonth = d.getMonth();
      }

      generatedDays.push({
        date: dateStr,
        value: data[dateStr] || 0,
        isFuture: d > today
      });
    }

    return { days: generatedDays, monthLabels: generatedMonthLabels };
  }, [data, weeks]);

  // Transform flat array into columns of 7 days
  const columns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }
    return cols;
  }, [days]);

  // Color logic using Tailwind classes
  const getColorClass = (value: number, isFuture: boolean) => {
    if (isFuture) return 'bg-[#FEFAE0] dark:bg-gray-700'; // Background color for future days
    if (value === 0) return 'bg-[#FEFAE0] dark:bg-gray-700'; // Empty day
    if (value === 1) return 'bg-[#A3B18A] dark:bg-green-700/60'; // Level 1
    if (value === 2) return 'bg-[#5D7C56] dark:bg-green-600/80'; // Level 2
    if (value >= 3) return 'bg-[#344E41] dark:bg-green-500'; // Level 3+
    return 'bg-[#FEFAE0] dark:bg-gray-700';
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-2">
      <div className="min-w-max inline-flex flex-col">
        {/* Month Labels */}
        <div className="flex h-5 relative text-xs text-[#344E41] dark:text-gray-100 font-medium opacity-60 mb-1 pl-6">
          {monthLabels.map((label, i) => (
            <div 
              key={`${label.month}-${i}`} 
              className="absolute whitespace-nowrap"
              style={{ left: `${(label.index * 16) + 24}px` }}
            >
              {label.month}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day of Week Labels */}
          <div className="flex flex-col justify-between text-[10px] text-[#344E41] dark:text-gray-100 font-medium opacity-60 pr-2 pb-1" style={{ height: '110px' }}>
            <span className="mt-1">Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          {/* Grid */}
          <div className="flex gap-1" style={{ height: '110px' }}>
            {columns.map((col, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1 h-full">
                {col.map((day, dayIndex) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (colIndex * 0.01) + (dayIndex * 0.01) }}
                    className={`w-3 h-3 rounded-[2px] relative group ${getColorClass(day.value, day.isFuture)}`}
                    style={{ 
                      opacity: day.isFuture ? 0 : 1 
                    }}
                  >
                    {!day.isFuture && (
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#344E41] dark:bg-gray-700 text-[#FEFAE0] dark:text-gray-300 text-xs rounded whitespace-nowrap z-10 pointer-events-none">
                        {day.value} contributions on {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {/* Tooltip triangle */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#344E41]"></div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
