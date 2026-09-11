'use client';

// components/quant/deep-quant/QuantActionBar.tsx
//
// FIND QUANT TRADE + the FIND/VERIFY mode picker. One component, rendered in the sidebar and
// again in the Agent View header.
//
// The button's disabled rule, its four labels and its three colour states are the panel's
// originals, unchanged: `disabled={!isAnalyzing && !dataReady}`, and AWAITING DATA… / STOP
// ANALYSIS / VERIFY MY SETUP / FIND QUANT TRADE in that precedence. `id="btn-run-deep-quant"` is
// kept because both e2e specs locate the button by it.
//
// The mode lives with the CALLER, not here. It is per-session state (`useFqMode`), and a
// component that owned it would give the dialog a second copy — the exact duplication the
// redesign is meant to remove.

import React from 'react';
import { ChevronDown, Loader2, Shield, Square, Zap } from 'lucide-react';
import { useQuantStore } from '../../../store/useQuantStore';

export type QuantMode = 'FIND' | 'VERIFY';

interface QuantActionBarProps {
  mode: QuantMode;
  onModeChange: (mode: QuantMode) => void;
  isAnalyzing: boolean;
  dataReady: boolean;
  onRun: () => void;
  onStop: () => void;
  /**
   * `sm` is the sidebar's 8px-tall control; `md` is the dialog's, which sits beside a heading and
   * would look undersized at the sidebar's scale. Presentation only — the states are identical.
   */
  size?: 'sm' | 'md';
  /**
   * Set on the dialog's copy. Only ONE element in a document may carry an id, and both surfaces
   * can be mounted at once (the dialog opens over the sidebar), so the sidebar keeps the id the
   * e2e specs look for and the dialog's copy goes without.
   */
  omitRunId?: boolean;
}

export default function QuantActionBar({
  mode,
  onModeChange,
  isAnalyzing,
  dataReady,
  onRun,
  onStop,
  size = 'sm',
  omitRunId = false,
}: QuantActionBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const isStarting = useQuantStore((s) => s.isStartingRun);

  const h = size === 'md' ? 'h-9' : 'h-8';
  const iconSize = size === 'md' ? 12 : 11;
  const textSize = size === 'md' ? 'text-[11px]' : 'text-[10px]';

  const label =
    !dataReady && !isAnalyzing
      ? 'AWAITING DATA…'
      : isStarting
        ? 'STARTING…'
        : isAnalyzing
          ? 'STOP ANALYSIS'
          : mode === 'VERIFY'
            ? 'VERIFY MY SETUP'
            : 'FIND TRADE';

  const analysisState = isStarting ? 'starting' : isAnalyzing ? 'analyzing' : 'idle';

  return (
    <div
      {...(omitRunId
        ? {}
        : {
          'data-tour': 'deep-quant-actions',
          'data-analysis-mode': mode,
          'data-analysis-state': analysisState,
        })}
      className="relative"
    >
      <div className="flex items-center gap-0">
        <button
          {...(omitRunId
            ? {}
            : { id: 'btn-run-deep-quant', 'data-tour': 'deep-quant-run-action' })}
          type="button"
          disabled={(!isAnalyzing && !dataReady) || isStarting}
          onClick={() => {
            if (isStarting) return;
            if (isAnalyzing) onStop();
            else onRun();
          }}
          className={`
            relative flex-grow flex ${h} items-center justify-center gap-1.5
            rounded-l-md px-3 ${textSize} font-bold uppercase tracking-wider
            transition-all duration-300 ease-out border border-r-0
            ${!dataReady && !isAnalyzing
              ? 'bg-elevated/40 text-text-muted/50 border-border-default opacity-50 cursor-not-allowed'
              : isStarting
                ? 'bg-emerald-600/80 text-white border-emerald-600 cursor-wait'
                : isAnalyzing
                  ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 hover:border-rose-700 active:scale-[0.99] cursor-pointer'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-500 active:scale-[0.99]'
            }
          `}
        >
          <span className="relative flex items-center gap-1.5">
            {!dataReady && !isAnalyzing ? (
              <Loader2 size={iconSize} className="animate-spin text-text-muted" />
            ) : isStarting ? (
              <Loader2 size={iconSize} className="animate-spin text-white" />
            ) : isAnalyzing ? (
              <Square size={iconSize} />
            ) : mode === 'VERIFY' ? (
              <Shield size={iconSize} className="group-hover:animate-pulse" />
            ) : (
              <Zap size={iconSize} className="group-hover:animate-pulse" />
            )}
            {label}
          </span>
        </button>

        {/* Dropdown Toggle */}
        <button
          {...(omitRunId ? {} : { 'data-tour': 'deep-quant-mode-toggle' })}
          type="button"
          disabled={isAnalyzing || isStarting}
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
          aria-label="Choose analysis mode"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            ${h} w-8 rounded-r-md border transition-all duration-300 flex items-center justify-center
            ${isAnalyzing
              ? 'bg-elevated/40 border-border-default text-text-muted/50 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-500 border-l-emerald-700/50'
            }
          `}
        >
          <ChevronDown
            size={iconSize}
            className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
          <div
            role="menu"
            className="absolute inset-x-0 mt-1.5 z-50 rounded bg-surface/95 backdrop-blur-xl border border-border-default/60 shadow-2xl p-1.5 flex flex-col gap-1"
          >
            <button
              {...(omitRunId ? {} : { 'data-tour': 'find-trade-option' })}
              type="button"
              role="menuitem"
              onClick={() => {
                onModeChange('FIND');
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-sm text-left transition-all ${mode === 'FIND' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'text-text-secondary hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
            >
              <Zap size={13} className="text-text-secondary" />
              <div className="flex flex-col">
                {/* Compliance: was "Find High-Probability Trade" / "Autonomous breakouts & quant
                    scanning". "High-Probability" states a probability about the outcome, which is
                    the reading docs/compliance/BRAND_GUIDELINES.md §1.2 exists to prevent, and
                    "Autonomous" reads as acting without the user (§1.1 rule 11). The mode scans
                    and proposes; it never acts. */}
                <span>Find a Trade Setup</span>
                <span className="text-[8px] font-normal text-text-muted">
                  Scans breakouts &amp; quant signals
                </span>
              </div>
            </button>

            <button
              {...(omitRunId ? {} : { 'data-tour': 'verify-trade-option' })}
              type="button"
              role="menuitem"
              onClick={() => {
                onModeChange('VERIFY');
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-sm text-left transition-all ${mode === 'VERIFY' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'text-text-secondary hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
            >
              <Shield size={13} className="text-text-secondary" />
              <div className="flex flex-col">
                <span>Verify My Trade Idea</span>
                <span className="text-[8px] font-normal text-text-muted">
                  Co-pilot critical Risk Manager critique
                </span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
