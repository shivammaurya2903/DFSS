import React from 'react';

const Avatar = ({ src, alt = 'Avatar', fallback, className = '' }) => {
  return (
    <div className={`w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center text-purple-700 font-medium ${className}`}>
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : fallback}
    </div>
  );
};

export default Avatar;

