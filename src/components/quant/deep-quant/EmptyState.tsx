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
        <div className="w-full max-w-[320px] px-2 flex items-center justify-center shrink-0">
          <AgentReadyIllustration className="w-full h-auto max-h-52 object-contain" />
        </div>
        <div className="mt-1">
          <p className="text-[12px] font-bold text-text-primary tracking-wider">
            Strat Agent Ready
          </p>
          <p className="text-[10px] text-text-muted mt-1.5 leading-relaxed max-w-[220px] mx-auto">
            Press the button above to run
            <br />
            the full AI analysis pipeline
            <br />
            for <span className="text-emerald-500 font-bold">{symbol}</span>
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
      className="flex-1 grow flex flex-col items-center justify-center gap-5 p-6 w-full h-full min-h-87.5 text-center my-auto"
    >
      {/* Animated SVG illustration */}
      <motion.div
        variants={fadeInUp}
        className="w-full max-w-[420px] px-4 flex items-center justify-center shrink-0 mb-2"
      >
        <AgentReadyIllustration className="w-full h-auto max-h-64 object-contain" />
      </motion.div>

      {/* Title & Description */}
      <motion.div variants={fadeInUp} className="text-center">
        <p className="text-[13px] font-bold text-text-primary tracking-wider">Strat Agent Ready</p>
        <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed max-w-60 mx-auto select-none">
          Press the button above to run
          <br />
          the full AI analysis pipeline
          <br />
          for <span className="text-emerald-500 font-bold">{symbol}</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
