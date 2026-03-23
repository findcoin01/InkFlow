import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background Circle with Gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" /> {/* Deep Slate/Ink */}
            <stop offset="100%" stopColor="#10B981" /> {/* Emerald */}
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" fillOpacity="0.1" stroke="url(#logoGradient)" strokeWidth="1" />
        
        {/* Stylized Pen Nib */}
        <path
          d="M50 20 L65 50 L50 80 L35 50 Z"
          fill="url(#logoGradient)"
          className="drop-shadow-sm"
        />
        <path
          d="M50 20 L50 50"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="50" cy="52" r="2" fill="white" />

        {/* Flowing Digital Wave */}
        <path
          d="M50 80 Q70 85 85 70 T95 50"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 4"
          className="animate-pulse"
        />
        <path
          d="M50 80 Q30 85 15 70 T5 50"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 4"
          className="animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        
        {/* Central "I" Accent */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          fontFamily="serif"
          style={{ pointerEvents: 'none' }}
        >
          IF
        </text>
      </svg>
    </div>
  );
};

export default Logo;
