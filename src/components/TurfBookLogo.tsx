import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const TurfBookLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const dimensions = {
    sm: { height: 34, iconWidth: 38, textClass: 'text-lg' },
    md: { height: 44, iconWidth: 48, textClass: 'text-2xl' },
    lg: { height: 60, iconWidth: 64, textClass: 'text-3xl' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Vector SVG Logo matching exact user uploaded image */}
      <svg
        width={dimensions.iconWidth}
        height={dimensions.height}
        viewBox="0 0 240 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-105 duration-200 shrink-0"
      >
        {/* Outer Green Book Cover Shape */}
        <path
          d="M 20 50 Q 120 70 120 165 Q 120 70 220 50 L 220 150 Q 120 170 120 185 Q 120 170 20 150 Z"
          fill="#238636"
        />

        {/* Inner White Pages Left */}
        <path
          d="M 28 56 Q 120 74 120 160 Q 70 150 28 144 Z"
          fill="#FFFFFF"
        />

        {/* Inner White Pages Right */}
        <path
          d="M 212 56 Q 120 74 120 160 Q 170 150 212 144 Z"
          fill="#FFFFFF"
        />

        {/* Center Spine Line Accent */}
        <line
          x1="120"
          y1="72"
          x2="120"
          y2="175"
          stroke="#238636"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center Tennis / Sports Ball */}
        <circle cx="120" cy="115" r="36" fill="#238636" />

        {/* Left Tennis Ball Seam (White Curve) */}
        <path
          d="M 102 91 C 114 103 114 127 102 139"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Tennis Ball Seam (White Curve) */}
        <path
          d="M 138 91 C 126 103 126 127 138 139"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className={`font-black tracking-wider uppercase ${dimensions.textClass} font-sans`}>
            <span className="text-[#238636]">TURF</span>
            <span className="text-[#262626]">BOOK</span>
          </span>
          <span className="text-[9px] tracking-[0.2em] text-[#238636] font-extrabold uppercase mt-0.5">
            SPORTS TURF BOOKING
          </span>
        </div>
      )}
    </div>
  );
};

