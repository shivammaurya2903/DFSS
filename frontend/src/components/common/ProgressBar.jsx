import React from 'react';

const ProgressBar = ({ value, size = 'md', color = 'primary', showPercentage = false }) => {
  const safeValue = Math.min(Math.max(0, value), 100);
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colorClasses = {
    primary: 'bg-[#8178F2]',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className="w-full flex items-center gap-3">
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${safeValue}%` }}
          role="progressbar"
          aria-valuenow={safeValue}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      {showPercentage && (
        <span className="text-sm font-medium text-gray-600 min-w-[3ch]">
          {Math.round(safeValue)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
