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
    sm: {
      svgClass: 'w-7 h-6 sm:w-8 sm:h-7',
      textClass: 'text-sm sm:text-base',
      subTextClass: 'text-[7px] sm:text-[8px] tracking-[0.14em]',
    },
    md: {
      svgClass: 'w-8 h-7 sm:w-10 sm:h-9',
      textClass: 'text-base sm:text-xl lg:text-2xl',
      subTextClass: 'text-[7.5px] sm:text-[8.5px] tracking-[0.15em] sm:tracking-[0.18em]',
    },
    lg: {
      svgClass: 'w-11 h-9 sm:w-14 sm:h-12',
      textClass: 'text-xl sm:text-2xl lg:text-3xl',
      subTextClass: 'text-[8.5px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.2em]',
    },
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 sm:gap-2.5 select-none shrink-0 ${className}`}>
      {/* Precision Vector SVG Logo */}
      <svg
        viewBox="0 0 240 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform hover:scale-105 duration-200 shrink-0 ${dimensions.svgClass}`}
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
          <span className={`font-black tracking-tight sm:tracking-wider uppercase ${dimensions.textClass} font-sans`}>
            <span className="text-[#238636]">TURF</span>
            <span className="text-[#262626] dark:text-white">BOOK</span>
          </span>
          <span className={`${dimensions.subTextClass} text-[#238636] font-extrabold uppercase mt-0.5 whitespace-nowrap`}>
            Book Some Turfs!
          </span>
        </div>
      )}
    </div>
  );
};
