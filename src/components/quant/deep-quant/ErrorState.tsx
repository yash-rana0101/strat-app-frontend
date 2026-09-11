'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { dashboardUrl, openExternalUrl } from '../../../lib/redirect';
import { classifyAgentError } from './agentErrorClassifier';

interface ErrorStateProps {
  error: string;
  dataReady: boolean;
  activeMode: 'FIND' | 'VERIFY';
  onRetryFind: () => void;
  onRetryVerify: () => void;
}

export default function ErrorState({
  error,
  dataReady,
  activeMode,
  onRetryFind,
  onRetryVerify,
}: ErrorStateProps) {
  const [showDetail, setShowDetail] = React.useState(false);
  const classified = classifyAgentError(error);
  const creditsExhausted = classified.kind === 'credits-exhausted';

  const handleRetry = () => {
    if (activeMode === 'FIND') {
      onRetryFind();
    } else {
      onRetryVerify();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3.5 p-4 py-8 select-none">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
        <AlertTriangle size={20} />
      </div>

      <div className="text-center">
        <p className="text-[12px] font-bold uppercase tracking-wider text-rose-400 font-mono">
          {creditsExhausted ? classified.title : 'Analysis Interrupted'}
        </p>
        {creditsExhausted && (
          <p className="mt-1 max-w-70 text-[10px] leading-relaxed text-text-secondary">
            {classified.explanation}
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowDetail(!showDetail)}
          className="text-[10px] text-text-muted hover:text-text-secondary mt-1 underline decoration-dotted transition-colors"
        >
          {showDetail ? 'Hide details' : 'View diagnostics'}
        </button>
      </div>

      {showDetail && (
        <div className="max-w-65 p-2.5 rounded bg-black/40 border border-rose-500/20 text-[9.5px] font-mono text-rose-300/90 leading-relaxed text-left break-all select-text">
          {error}
        </div>
      )}

      {creditsExhausted ? (
        <button
          type="button"
          onClick={() => void openExternalUrl(dashboardUrl())}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm active:scale-95"
        >
          Top Up Credits
          <ArrowRight size={12} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleRetry}
          disabled={!dataReady}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm ${!dataReady ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'
            }`}
        >
          <RotateCcw size={12} />
          Retry Pipeline
        </button>
      )}
    </div>
  );
}
