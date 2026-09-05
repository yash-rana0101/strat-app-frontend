'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingStateProps {
  agentStatus?: string;
}

const PHASES = [
  { label: 'CONNECTING', sub: 'ESTABLISHING FEED' },
  { label: 'SCANNING SIGNALS', sub: 'RADAR SWEEP' },
  { label: 'DEEP ANALYSIS', sub: 'NEURAL CONFLUENCE' },
  { label: 'SYNTHESIZING SETUP', sub: 'FINAL INFERENCE' },
];

export default function LoadingState({ agentStatus }: LoadingStateProps) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current phase based on elapsed seconds
  const currentPhaseIndex = elapsed < 3 ? 0 : elapsed < 8 ? 1 : elapsed < 16 ? 2 : 3;
  const currentPhase = PHASES[currentPhaseIndex];

  // Calculated smooth progress ring (starts at 15%, asymptotically approaches 96%)
  const progressPercent = Math.min(94, Math.round(15 + (1 - Math.exp(-elapsed / 12)) * 80));
  const strokeDashoffset = 283 - (283 * progressPercent) / 100; // 2 * pi * 45 ≈ 283

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-6 px-4 w-full select-none">
      {/* Visual Theatre: Live Animated AI Radar Core */}
      <div className="relative w-44 h-44 rounded-full overflow-hidden border border-emerald-500/35 shadow-[0_0_30px_rgba(16,185,129,0.25)] flex items-center justify-center bg-black/90 group">
        {/* Generated AI Neural Radar Background */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/radar_loading_sweep.jpg"
            alt="AI Radar Scanning"
            fill
            className="object-cover opacity-75 transition-transform duration-1000 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/80" />
        </div>

        {/* Live SVG Radar Overlay & Progress Ring */}
        <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
          <defs>
            <linearGradient id="sweepCone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>

            <style>{`
              @keyframes radarSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .anim-radar-spin {
                transform-origin: 60px 60px;
                animation: radarSpin 3s linear infinite;
              }
            `}</style>
          </defs>

          {/* Rotating radar sweep line & light beam */}
          <g className="anim-radar-spin">
            <path d="M 60 60 L 60 4 A 56 56 0 0 1 108 30 Z" fill="url(#sweepCone)" opacity="0.7" />
            <line x1="60" y1="60" x2="60" y2="4" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.85" />
          </g>

          {/* Outer SVG Smooth Progress Ring */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="283"
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
            transform="rotate(-90 60 60)"
          />

          {/* Central Beacon Dot */}
          <circle cx="60" cy="60" r="3" fill="#10b981" />
          <circle cx="60" cy="60" r="1.2" fill="#ecfdf5" />
        </svg>

        {/* Center Progress Number Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className="text-[11px] font-mono font-bold text-emerald-200 tracking-tight bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-xs">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Phased Badge — Max 2 words */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase font-mono">
              {currentPhase.label}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Live Status Tag */}
        {agentStatus ? (
          <div className="text-[10px] font-mono text-text-muted/70 tracking-wider uppercase truncate max-w-[240px]">
            {agentStatus}
          </div>
        ) : (
          <div className="text-[9px] font-mono text-text-muted/50 tracking-widest uppercase">
            {currentPhase.sub}
          </div>
        )}
      </div>

      {/* Segmented Phase Indicators */}
      <div className="flex gap-1.5 items-center">
        {PHASES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === currentPhaseIndex
                ? 'w-5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                : i < currentPhaseIndex
                ? 'w-2 bg-emerald-600/70'
                : 'w-2 bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
