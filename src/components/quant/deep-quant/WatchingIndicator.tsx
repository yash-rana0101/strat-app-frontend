'use client';

import React from 'react';
import { Eye, Radio } from 'lucide-react';

export default function WatchingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in font-sans w-full my-2 select-none">
      <div className="relative w-full rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 overflow-hidden shadow-sm">
        {/* Subtle ambient pulse glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent animate-pulse pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
              <Eye size={11} className="animate-pulse" />
            </div>
            <span className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-text-primary">
              AI WATCHER ACTIVE
            </span>
          </div>

          {/* Floating LIVE badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
            </span>
            <span className="text-[9px] font-mono font-bold tracking-widest text-amber-400">
              LIVE
            </span>
          </div>
        </div>

        {/* Mini Visual Target Boundaries Bar */}
        <div className="mt-3 pt-2.5 border-t border-amber-500/15 relative z-10 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[8.5px] font-mono text-text-muted uppercase">
            <span>Floor Band</span>
            <span className="text-amber-400/90 font-semibold tracking-wider">Trigger Zone Armed</span>
            <span>Ceiling Band</span>
          </div>

          {/* Animated Boundary Range Bar */}
          <div className="h-1.5 w-full rounded-full bg-elevated/80 border border-border-default/40 overflow-hidden relative">
            <div className="absolute inset-y-0 left-1/4 right-1/4 rounded-full bg-gradient-to-r from-amber-500/40 via-amber-400 to-amber-500/40 animate-pulse" />
            {/* Ambient scanning cursor */}
            <div
              className="absolute top-0 bottom-0 w-8 bg-white/40 blur-[1px] animate-pulse"
              style={{
                animation: 'scanlineSweep 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
