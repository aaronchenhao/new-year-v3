import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'neon';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  // Pill shape, no border, soft shadow, subtle transform on active
  const baseStyles = "px-6 py-4 font-bold text-lg md:text-xl transition-all duration-300 active:scale-95 hover:-translate-y-1 soft-shadow rounded-full relative overflow-hidden group tracking-wider flex items-center justify-center gap-2";
  
  const variants = {
    // Soft Gold / Yellow
    primary: "bg-[#FFD56B] text-[#5D4037] hover:bg-[#FFE08A]", 
    // Cream / White
    secondary: "bg-white text-[#5D4037] hover:bg-[#F9F9F9]", 
    // Muted Dark Red/Brown
    danger: "bg-[#5D4037] text-white hover:bg-[#4E342E]", 
    // Pastel Purple
    neon: "bg-[#DCD3FF] text-[#5D4037] hover:bg-[#EDE7FF]", 
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {children}
    </button>
  );
};