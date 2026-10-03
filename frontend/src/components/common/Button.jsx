import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  className = '', 
  iconOnly = false,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-[#6c63e6] border border-transparent disabled:bg-primary/50 disabled:text-white/70",
    secondary: "bg-[#F8F9FC] text-[#17181C] hover:bg-[#E7E9EF] border border-[#E7E9EF] disabled:bg-gray-50 disabled:text-gray-400",
    outline: "bg-transparent text-[#17181C] hover:bg-[#F8F9FC] border border-[#E7E9EF] disabled:border-gray-200 disabled:text-gray-400",
    ghost: "bg-transparent text-[#6F737D] hover:bg-[#F8F9FC] border border-transparent hover:text-[#17181C] disabled:text-gray-400",
    danger: "bg-white text-[#E88B8B] hover:bg-[#fef2f2] border border-[#E88B8B] hover:border-red-400 disabled:border-red-200 disabled:text-red-300"
  };

  const sizes = {
    sm: iconOnly ? "p-1.5" : "px-3 py-1.5 text-sm gap-1.5",
    md: iconOnly ? "p-2" : "px-4 py-2 text-sm gap-2",
    lg: iconOnly ? "p-3" : "px-5 py-2.5 text-base gap-2"
  };

  const isDisabled = disabled || loading;

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'cursor-not-allowed opacity-70' : ''} ${className}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {!loading && children}
    </button>
  );
};

export default Button;
