'use client';

// components/quant/deep-quant/LoadingState.tsx
//
// Simple and clean spinner loader with a clear message while awaiting the agent's first reasoning step.

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  agentStatus?: string;
  message?: string;
}

export default function LoadingState({ agentStatus, message }: LoadingStateProps) {
  const displayMessage =
    message ||
    (agentStatus && agentStatus !== 'Awaiting trigger...'
      ? agentStatus
      : 'Analyzing market data…');

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 min-h-[160px] flex-col items-center justify-center gap-3 py-10 px-4 text-center select-none animate-fade-in"
    >
      <Loader2
        size={24}
        className="animate-spin text-emerald-500 dark:text-emerald-400"
        aria-hidden="true"
      />
      <span className="text-xs font-medium text-text-secondary tracking-wide">
        {displayMessage}
      </span>
    </div>
  );
}
