'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface OrderBookVolumeRatioProps {
  bidVolPct: number;
  askVolPct: number;
}

export default function OrderBookVolumeRatio({ bidVolPct, askVolPct }: OrderBookVolumeRatioProps) {
  return (
    <div className="shrink-0 px-3.5 py-2 border-t border-border-default bg-elevated/20 font-sans">
      <div className="flex justify-between text-[10px] font-black mb-1.5 tracking-wider font-sans">
        <span className="text-emerald-400">{bidVolPct.toFixed(1)}% BIDS</span>
        <span className="text-red-400">{askVolPct.toFixed(1)}% ASKS</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-border-default/40 flex overflow-hidden">
        {/* Bid Volume (Green) */}
        <motion.div
          className="h-full bg-emerald-500"
          animate={{ width: `${bidVolPct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
        {/* Ask Volume (Red) */}
        <motion.div
          className="h-full bg-red-500"
          animate={{ width: `${askVolPct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
        {/* 50/50 Divider Mark */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/60 z-10" />
      </div>
    </div>
  );
}

