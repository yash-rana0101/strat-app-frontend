import React from 'react';

export interface StratAiLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Official Strat AI Logo — razor-sharp vector SVG icon with red and green arrows.
 * Replaces blurred/clipped rasterized img tags across the application.
 */
export default function StratAiLogo({
  size = 16,
  className = '',
  ...props
}: StratAiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="30 25 315 325"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* Lower-right red arrow */}
      <path
        fill="#ff3131"
        d="M 134.516 345.328 L 339.641 345.328 L 339.641 237.066 L 237.078 136.633 L 237.078 240.98 L 32.66 240.98 Z"
      />
      {/* Upper-left green arrow */}
      <path
        fill="#7ed957"
        d="M 240.488 29.66 L 35.352 29.66 L 35.352 137.926 L 137.914 238.355 L 137.914 134.008 L 342.336 134.008 Z"
      />
    </svg>
  );
}

