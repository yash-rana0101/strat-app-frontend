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
      <div className="flex flex-col items-center justify-center gap-2 p-3 py-4 w-full text-center select-none">
        <div className="w-48 h-24 sm:w-52 sm:h-28 flex items-center justify-center shrink-0">
          <AgentReadyIllustration className="w-full h-full" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-text-primary tracking-wider">Strat Agent Ready</p>
          <p className="text-[9.5px] text-text-muted mt-1 leading-relaxed max-w-50 mx-auto">
            Press the button above to run<br />
            the full AI analysis pipeline<br />
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
      className="grow flex flex-col items-center justify-center gap-5 p-6 w-full h-full min-h-87.5"
    >
      {/* Animated SVG illustration */}
      <motion.div variants={fadeInUp} className="w-72 h-40 flex items-center justify-center shrink-0 mb-2.5">
        <AgentReadyIllustration className="w-full h-full" />
      </motion.div>

      {/* Title & Description */}
      <motion.div variants={fadeInUp} className="text-center">
        <p className="text-[11px] font-bold text-text-primary tracking-wider">Strat Agent Ready</p>
        <p className="text-[9.5px] text-text-secondary mt-1.5 leading-relaxed max-w-50 mx-auto select-none">
          Press the button above to run<br />
          the full AI analysis pipeline<br />
          for <span className="text-emerald-500 font-bold">{symbol}</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
