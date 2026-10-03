import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    default: "bg-[#F8F9FC] text-[#6F737D] border border-[#E7E9EF]",
    primary: "bg-[#EEEAFD] text-[#8178F2] border border-[#8178F2]/20",
    success: "bg-[#f0fdf4] text-[#69B38A] border border-[#69B38A]/20",
    warning: "bg-[#fffbeb] text-[#E9B85D] border border-[#E9B85D]/20",
    danger: "bg-[#fef2f2] text-[#E88B8B] border border-[#E88B8B]/20",
    info: "bg-[#eff6ff] text-[#3b82f6] border border-[#3b82f6]/20"
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs"
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
