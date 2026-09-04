'use client';

import React, { useState, useMemo } from 'react';
import { useQuantStore, ChartPattern } from '../../../store/useQuantStore';
import { useTradeStore, ChartTimeframe } from '../../../store/useTradeStore';
import { useRadarStore } from '../../../store/useRadarStore';
import { Sparkles, Activity, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  PATTERN_TIMEFRAMES,
  bestPatternTimeframe,
  patternCountFor,
  totalPatternCount,
} from '../../panels/left-panel/patternsSummary';
import PatternTimeframeTabs from './PatternTimeframeTabs';
import PatternCard from './PatternCard';

interface MultiTfPatternsViewProps {
  variant?: 'panel' | 'sheet';
}

export default function MultiTfPatternsView({ variant = 'panel' }: MultiTfPatternsViewProps = {}) {
  const inSheet = variant === 'sheet';
  const { multiTfPatterns, isFetchingPatterns, patternsError } = useQuantStore();
  const selectedSymbol = useTradeStore((s) => s.selectedSymbol);
  const [userSelectedTf, setUserSelectedTf] = useState<string | null>(null);

  const timeframes = PATTERN_TIMEFRAMES;
  const bestTf = useMemo(() => bestPatternTimeframe(multiTfPatterns), [multiTfPatterns]);
  const selectedTf = userSelectedTf ?? bestTf;

  const currentTfData = multiTfPatterns?.find((p) => p.timeframe === selectedTf);
  const patterns = currentTfData?.patterns || [];
  const getPatternCount = (tf: string) => patternCountFor(multiTfPatterns, tf);
  const totalPatterns = useMemo(() => totalPatternCount(multiTfPatterns), [multiTfPatterns]);

  const handlePatternClick = (p: ChartPattern) => {
    const symbol = useTradeStore.getState().selectedSymbol || 'RELIANCE';

    useTradeStore.getState().setSelectedSymbol(symbol);
    useTradeStore.getState().setActiveTimeframe(selectedTf as ChartTimeframe);

    const isBullish = p.sentiment.toLowerCase() === 'bullish';
    const isBearish = p.sentiment.toLowerCase() === 'bearish';
    const bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = isBullish
      ? 'BULLISH'
      : isBearish
        ? 'BEARISH'
        : 'NEUTRAL';

    const locatedPattern = {
      name: p.pattern_type,
      bias,
      candle_index: p.end_idx,
      time: p.time ?? 0,
      start_time: p.start_time,
      open: 0,
      close: 0,
      high: p.high ?? 0,
      low: p.low ?? 0,
    };

    const target = {
      symbol,
      timeframe: selectedTf as any,
      kind: 'pattern' as const,
      pattern: locatedPattern,
    };

    useRadarStore.getState().setVizTarget(target);
  };

  const pad = inSheet ? 'px-4' : 'px-3';

  return (
    <div
      className={`border-b border-border-default px-0 bg-transparent select-none ${inSheet ? 'py-3' : 'py-2.5'}`}
    >
      {/* ── Section Header (Panel variant only) ── */}
      <div className={`flex items-center gap-1.5 mb-2.5 ${pad}`}>
        <Sparkles size={inSheet ? 13 : 11} className="text-text-muted" />
        {!inSheet && (
          <h3 className="text-[9.5px] font-bold text-text-secondary uppercase tracking-wider">
            Dynamic Pattern Scanner
          </h3>
        )}
        {isFetchingPatterns ? (
          <span className="ml-auto flex items-center gap-1">
            <Loader2 size={9} className="animate-spin text-primary" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-primary">
              Scanning
            </span>
          </span>
        ) : (
          totalPatterns > 0 && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-bull animate-ping opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted font-mono">
                {totalPatterns} live
              </span>
            </span>
          )
        )}
      </div>

      {/* ── Timeframe Selector Tabs ── */}
      <PatternTimeframeTabs
        timeframes={timeframes}
        selectedTf={selectedTf}
        onSelectTf={setUserSelectedTf}
        getPatternCount={getPatternCount}
        isFetchingPatterns={isFetchingPatterns}
        inSheet={inSheet}
      />

      {/* ── Patterns List ── */}
      <div
        className={`mt-2 ${
          inSheet
            ? 'flex flex-col gap-2.5 px-4'
            : 'max-h-47.5 overflow-y-auto scrollbar-thin flex flex-col gap-2 px-3'
        }`}
      >
        {isFetchingPatterns ? (
          <div className="space-y-2 py-1">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse flex flex-col gap-2 rounded-xl border border-border-default/40 bg-elevated/20 p-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-3.5 w-24 bg-elevated/60 rounded-full" />
                  <div className="h-3.5 w-14 bg-elevated/60 rounded-full" />
                </div>
                <div className="h-2 w-full bg-elevated/30 rounded-full" />
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="h-2 bg-elevated/30 rounded-full" />
                  <div className="h-2 bg-elevated/30 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : patternsError ? (
          <div
            role="status"
            className="flex flex-col gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0 text-amber-500 dark:text-amber-400" />
              <span className="text-[9.5px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">
                Scan unavailable
              </span>
            </div>
            <p className="text-xs leading-relaxed text-amber-700/90 dark:text-amber-300/80 break-words font-sans">
              {patternsError}
            </p>
            <button
              type="button"
              onClick={() => {
                const sym = selectedSymbol || 'RELIANCE';
                void useQuantStore.getState().fetchMultiTfPatterns(sym);
              }}
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-500/30 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 transition-colors hover:bg-amber-500/10 cursor-pointer"
            >
              <RefreshCw size={9} />
              Retry scan
            </button>
          </div>
        ) : patterns.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center text-center rounded-xl border border-border-default/40 bg-elevated/10 ${
              inSheet ? 'py-10' : 'py-5'
            }`}
          >
            <Activity size={inSheet ? 18 : 14} className="text-text-muted mb-1 opacity-60" />
            <span className="text-xs font-semibold text-text-secondary">No patterns forming</span>
            <span className="text-[10px] text-text-muted mt-0.5 font-mono">Timeframe: {selectedTf}</span>
          </div>
        ) : (
          patterns.map((p, idx) => (
            <PatternCard
              key={`${p.pattern_type}-${p.start_idx}-${p.end_idx}-${idx}`}
              pattern={p}
              index={idx}
              inSheet={inSheet}
              onClick={handlePatternClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
