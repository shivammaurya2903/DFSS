import React from 'react';

const PageContainer = ({ children, className = '' }) => {
  return (
    <div className={`p-6 max-w-7xl mx-auto ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;

