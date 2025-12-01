import React from 'react';

const PieChart = ({ yesVotes, noVotes, size = 120 }) => {
  const total = yesVotes + noVotes;
  const yesPercent = total > 0 ? (yesVotes / total) * 100 : 0;
  const noPercent = total > 0 ? (noVotes / total) * 100 : 0;
  
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const yesArcLength = (yesPercent / 100) * circumference;
  const noArcLength = (noPercent / 100) * circumference;
  
  if (total === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400">No votes</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
        />
        
        {/* Yes votes (green) - starts at top */}
        {yesPercent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth="20"
            strokeDasharray={`${yesArcLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        
        {/* No votes (red) - starts after yes votes */}
        {noPercent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth="20"
            strokeDasharray={`${noArcLength} ${circumference}`}
            strokeDashoffset={-yesArcLength}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900">{total}</div>
        <div className="text-xs text-gray-500">votes</div>
      </div>
    </div>
  );
};

export default PieChart;

