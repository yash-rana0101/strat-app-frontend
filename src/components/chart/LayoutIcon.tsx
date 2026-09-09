import React from 'react';
import type { ChartLayoutId } from '../../types/chartLayout';
import { LAYOUT_DIVIDERS } from './layoutDividers';

interface LayoutIconProps {
  id: ChartLayoutId;
  size?: number;
  className?: string;
}

/**
 * High-fidelity vector SVG icon for each multi-chart layout arrangement
 * matching TradingView's visual grid representations.
 */
export const LayoutIcon: React.FC<LayoutIconProps> = ({ id, size = 26, className = '' }) => {
  const dividers = LAYOUT_DIVIDERS[id] || [];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <rect x="3" y="3" width="22" height="22" rx="2.5" />
      {dividers.map(([x1, y1, x2, y2], idx) => (
        <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </svg>
  );
};
