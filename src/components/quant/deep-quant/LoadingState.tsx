'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { crossfade, scaleIn } from '../../../lib/motionVariants';

const LOADING_PHASES = [
  'Aggregating 50+ Technical Indicators...',
  'Scanning Candlestick Patterns...',
  'Evaluating Institutional Strategies...',
  'Fetching Live News Context...',
  'Constructing Master Prompt...',
  'Awaiting DeepSeek Analysis...',
];

interface LoadingStateProps {
  agentStatus: string;
}

export default function LoadingState({ agentStatus }: LoadingStateProps) {
  const [phaseIdx, setPhaseIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIdx((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border-default bg-surface">
        <Loader2 size={22} className="text-primary animate-spin" />
      </div>

      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phaseIdx}
            variants={crossfade}
            initial="hidden"
            animate="show"
            exit="exit"
            className="text-[11px] font-semibold text-text-primary"
          >
            {LOADING_PHASES[phaseIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-[9px] text-text-muted/50 mt-1.5">This may take 10–30 seconds</p>
      </div>

      {/* Real-time status display */}
      <div className="w-full max-w-[240px] p-2.5 bg-black/40 border border-emerald-500/20 rounded font-mono text-[10px] flex items-center space-x-2 animate-pulse text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <span className="truncate">{agentStatus}</span>
      </div>

      {/* Phase dots */}
      <div className="flex gap-1">
        {LOADING_PHASES.map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className={`h-1 w-1 rounded-full transition-colors duration-300 ${
              i <= phaseIdx ? 'bg-emerald-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
