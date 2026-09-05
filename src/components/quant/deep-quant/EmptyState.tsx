'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainerSlow, fadeInUp } from '../../../lib/motionVariants';
import AgentReadyIllustration from './AgentReadyIllustration';

interface EmptyStateProps {
  symbol: string;
  compact?: boolean;
}

export default function EmptyState({ symbol, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex-1 grow flex flex-col items-center justify-center gap-3 p-4 w-full h-full text-center select-none my-auto">
        <div className="w-full max-w-[280px] px-2 flex items-center justify-center shrink-0">
          <AgentReadyIllustration className="w-full h-auto max-h-48 object-contain" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Agent Ready
          </div>
          <p className="text-[10px] text-text-muted tracking-wide">
            Standing by for <span className="text-text-primary font-medium">{symbol}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerSlow}
      initial="hidden"
      animate="show"
      className="flex-1 grow flex flex-col items-center justify-center gap-4 p-6 w-full h-full min-h-87.5 text-center my-auto"
    >
      {/* Animated SVG illustration */}
      <motion.div
        variants={fadeInUp}
        className="w-full max-w-[360px] px-4 flex items-center justify-center shrink-0"
      >
        <AgentReadyIllustration className="w-full h-auto max-h-56 object-contain" />
      </motion.div>

      {/* Title & Description */}
      <motion.div variants={fadeInUp} className="flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Quant Engine Ready
        </div>
        <p className="text-[11px] text-text-muted tracking-wide">
          Ready to synthesize pipeline for <span className="text-emerald-400 font-medium">{symbol}</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
