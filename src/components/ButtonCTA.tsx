import React from 'react';

interface ButtonCTAProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const ButtonCTA = ({ children, className = '', ...props }: ButtonCTAProps) => {
  return (
    <button 
      className={`bg-orange-500 hover:bg-orange-600 transition-colors text-white font-semibold py-2 px-4 rounded text-sm sm:text-base ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
