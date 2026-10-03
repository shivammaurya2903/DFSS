import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ children, content, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      ref={triggerRef}
    >
      {children}
      
      {isVisible && content && (
        <div 
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm whitespace-nowrap pointer-events-none fade-in ${getPositionClasses()}`}
        >
          {content}
          
          {/* Arrow */}
          <div 
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2' :
              position === 'right' ? 'right-full top-1/2 -translate-y-1/2 translate-x-1/2' :
              'top-full left-1/2 -translate-x-1/2 -translate-y-1/2'
            }`} 
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
