import React from 'react';

interface ShutterhausLogoProps {
  variant?: 'stacked' | 'mark' | 'horizontal';
  className?: string;
  iconSize?: number;
}

export const ShutterhausLogo: React.FC<ShutterhausLogoProps> = ({
  variant = 'stacked',
  className = '',
  iconSize = 40,
}) => {
  // Overlapping circles minimalist vector mark
  const logoMark = (
    <svg 
      width={iconSize} 
      height={(iconSize * 32) / 44} 
      viewBox="0 0 44 32" 
      className="text-espresso dark:text-alabaster shrink-0" 
      fill="none"
    >
      <circle cx="17" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="27" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" />
      <line x1="22" y1="6.2" x2="22" y2="25.8" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="22" cy="16" r="1.3" fill="currentColor" />
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{logoMark}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2.5 text-espresso dark:text-alabaster ${className}`}>
        {logoMark}
        <span className="font-sans font-semibold tracking-[0.25em] text-xs uppercase">
          SHUTTERHAUS <span className="font-light opacity-80">VISUALS</span>
        </span>
      </div>
    );
  }

  // Full stacked logo to match the user's uploaded correct logo image exactly
  return (
    <div className={`flex flex-col items-center text-center text-espresso dark:text-alabaster select-none ${className}`}>
      {/* 1. Circles Mark */}
      <div className="mb-6">
        <svg 
          width="120" 
          height="88" 
          viewBox="0 0 44 32" 
          className="text-espresso dark:text-alabaster" 
          fill="none"
        >
          <circle cx="17" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="27" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" />
          <line x1="22" y1="6.2" x2="22" y2="25.8" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
          <circle cx="22" cy="16" r="1.2" fill="currentColor" />
        </svg>
      </div>

      {/* 2. Brand Name "SHUTTERHAUS" in elegant Serif */}
      <h2 className="font-serif text-3xl sm:text-4xl tracking-[0.18em] font-normal uppercase leading-none pl-[0.18em]">
        SHUTTERHAUS
      </h2>

      {/* 3. Horizontal thin divider line */}
      <div className="w-48 sm:w-56 h-[1px] bg-espresso/20 dark:bg-alabaster/20 my-5" />

      {/* 4. Subtitle "VISUALS" in spaced-out Sans */}
      <p className="font-sans text-[10px] sm:text-[11px] tracking-[0.6em] font-light uppercase text-espresso/80 dark:text-alabaster/85 pl-[0.6em]">
        VISUALS
      </p>
    </div>
  );
};
