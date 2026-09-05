'use client';

import React from 'react';

export interface ConvictionGaugeProps {
  score?: number | null;
  action?: 'BUY' | 'SELL' | 'HOLD' | string;
  tier?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function ConvictionGauge({
  score,
  action,
  tier,
  size = 'md',
  showLabel = true,
  className = '',
}: ConvictionGaugeProps) {
  const safeScore =
    typeof score === 'number' && !isNaN(score) ? Math.min(100, Math.max(0, score)) : null;
  const isSell = (action || '').toUpperCase() === 'SELL';
  const isStandAside = tier === 'stand_aside' || (action || '').toUpperCase() === 'HOLD';

  // Tone palette
  const getTheme = () => {
    if (safeScore === null)
      return {
        stroke: '#64748b',
        text: 'text-text-muted',
        badge: 'bg-elevated text-text-muted border-border-default',
      };
    if (isStandAside)
      return {
        stroke: '#f59e0b',
        text: 'text-amber-500 dark:text-amber-400',
        badge: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30',
      };
    if (isSell)
      return {
        stroke: '#f43f5e',
        text: 'text-rose-500 dark:text-rose-400',
        badge: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/30',
      };
    if (safeScore >= 80)
      return {
        stroke: '#10b981',
        text: 'text-emerald-500 dark:text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30',
      };
    if (safeScore >= 60)
      return {
        stroke: '#06b6d4',
        text: 'text-cyan-500 dark:text-cyan-400',
        badge: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/30',
      };
    return {
      stroke: '#f59e0b',
      text: 'text-amber-500 dark:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30',
    };
  };

  const theme = getTheme();

  // Tier label
  const getTierLabel = () => {
    if (tier === 'a_plus' || (safeScore && safeScore >= 85)) return 'A+ SETUP';
    if (safeScore && safeScore >= 75) return 'HIGH CONVICTION';
    if (safeScore && safeScore >= 55) return 'MODERATE';
    if (isStandAside) return 'STAND ASIDE';
    return safeScore !== null ? 'LOW CONVICTION' : 'PENDING';
  };

  // Dimensions
  const config = {
    sm: { dim: 42, radius: 17, strokeWidth: 3.5, fontSize: 'text-[11px]', subText: 'text-[7px]' },
    md: { dim: 68, radius: 28, strokeWidth: 5, fontSize: 'text-base', subText: 'text-[8.5px]' },
    lg: { dim: 96, radius: 40, strokeWidth: 6.5, fontSize: 'text-2xl', subText: 'text-[10px]' },
  }[size];

  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset =
    safeScore !== null ? circumference - (circumference * safeScore) / 100 : circumference;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Radial Gauge */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: config.dim, height: config.dim }}
      >
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${config.dim} ${config.dim}`}
          
        >
          {/* Background track */}
          <circle
            cx={config.dim / 2}
            cy={config.dim / 2}
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-border-default/40"
          />
          {/* Progress arc */}
          <circle
            cx={config.dim / 2}
            cy={config.dim / 2}
            r={config.radius}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none select-none">
          <span className={`font-mono font-black tracking-tight ${config.fontSize} ${theme.text}`}>
            {safeScore !== null ? `${safeScore}` : '—'}
          </span>
          {size !== 'sm' && (
            <span className="text-[7.5px] font-bold text-text-muted/70 tracking-widest mt-0.5">
              %
            </span>
          )}
        </div>
      </div>

      {/* Label & Tier badge */}
      {showLabel && (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
            Conviction
          </span>
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border select-none ${theme.badge}`}
          >
            {getTierLabel()}
          </span>
        </div>
      )}
    </div>
  );
}
