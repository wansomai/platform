// src/components/common/LogoAnimation.tsx
import React from 'react';

interface LogoAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LogoAnimation: React.FC<LogoAnimationProps> = ({ 
  size = 'md', 
  color = 'currentColor',
  className = ''
}) => {
  // Define sizes based on the size prop
  const dimensions = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 }
  };

  const { width, height } = dimensions[size];

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 1000 1000" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="animate-pulse"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#005c4d" />
            <stop offset="100%" stopColor="#e89e00" />
          </linearGradient>
        </defs>
        
        {/* Logo shapes */}
        <path 
          d="M346.7 41.7h611.7v611.7h-611.7z" 
          stroke="url(#logoGradient)" 
          strokeWidth="30" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="transparent"
        />
        <path 
          d="M178.3 210h611.7v611.7H178.3z" 
          stroke="url(#logoGradient)" 
          strokeWidth="30" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="transparent"
        />
        <path 
          d="M53.3 335h611.7v611.7H53.3z" 
          stroke="url(#logoGradient)" 
          strokeWidth="30" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="transparent"
        />
        <path 
          d="M53.3 946.7L958.3 41.7" 
          stroke="url(#logoGradient)" 
          strokeWidth="30" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default LogoAnimation;