'use client';

import React from 'react';
import Image from 'next/image';

interface AgentReadyIllustrationProps {
  className?: string;
}

export default function AgentReadyIllustration({
  className = 'w-full h-auto',
}: AgentReadyIllustrationProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Ambient background bloom */}
      <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-2xl animate-pulse pointer-events-none" />

      {/* Container with terminal border & subtle glow */}
      <div className="relative rounded-xl overflow-hidden border border-emerald-500/25 bg-black/60 shadow-[0_0_30px_rgba(16,185,129,0.15)] group transition-all duration-500">
        {/* Corner Crosshair Accents */}
        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-emerald-400/50 pointer-events-none z-10" />
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-emerald-400/50 pointer-events-none z-10" />
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-emerald-400/50 pointer-events-none z-10" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-emerald-400/50 pointer-events-none z-10" />

        {/* Generated AI Image */}
        <div className="relative aspect-video w-full max-w-[400px]">
          <Image
            src="/agent_ready_orb.jpg"
            alt="Strat Agent Neural Ready Orb"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          {/* Subtle vignette / gradient overlay to blend into the terminal dark mode */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
