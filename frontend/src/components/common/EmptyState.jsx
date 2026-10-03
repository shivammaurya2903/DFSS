import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, description, action, variant = 'default', className = '' }) => {
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
        {Icon && (
          <div className="w-10 h-10 bg-[#F8F9FC] rounded-full flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-[#9A9EA8]" />
          </div>
        )}
        <h3 className="text-sm font-medium text-[#17181C] mb-1">{title}</h3>
        {description && <p className="text-xs text-[#6F737D] mb-4 max-w-[250px]">{description}</p>}
        {action && (
          action.href ? (
            <Link to={action.href} className="text-sm font-medium text-primary hover:text-[#6c63e6]">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="text-sm font-medium text-primary hover:text-[#6c63e6]">
              {action.label}
            </button>
          )
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center bg-white rounded-xl border border-[#E7E9EF] p-12 text-center h-64 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-[#F8F9FC] rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#9A9EA8]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#17181C] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#6F737D] max-w-sm mb-6">{description}</p>}
      
      {action && (
        action.href ? (
          <Link 
            to={action.href} 
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-[#6c63e6] transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button 
            onClick={action.onClick}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-[#6c63e6] transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
