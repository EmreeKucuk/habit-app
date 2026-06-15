import React from 'react';

interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  completed, 
  total, 
  size = 150, 
  strokeWidth = 14 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Handle edge cases
  const safeTotal = total > 0 ? total : 1;
  const rawPercentage = (completed / safeTotal) * 100;
  const percentage = Math.min(100, Math.max(0, rawPercentage));
  
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          stroke="#EAEBE8" // subtle gray background matching palette
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          stroke="#344E41" // Dark text/icon color for progress
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center text-[#344E41] dark:text-gray-100">
        <span className="text-3xl font-bold tracking-tighter">{completed}</span>
        <span className="text-xs uppercase font-medium opacity-70 border-t border-[#344E41] dark:border-gray-700 border-opacity-20 pt-1 mt-1 w-8 text-center">
          {total}
        </span>
      </div>
    </div>
  );
};

export default CircularProgress;
