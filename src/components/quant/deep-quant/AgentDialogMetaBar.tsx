'use client';

// components/quant/deep-quant/AgentDialogMetaBar.tsx
//
// Meta information bar and primary execution controls for DeepQuantAgentDialog.
// Displays symbol badges, candle count, step count, model selector, credits,
// mode switch tabs (Find / Verify), and the main action button.

import React from 'react';
import { Coins, Loader2, Shield, Square, Zap } from 'lucide-react';
import { isFnoSymbol } from '../../../charting/symbolUtils';
import ModelSelector from './ModelSelector';
import type { QuantMode } from './QuantActionBar';

export interface AgentDialogMetaBarProps {
  symbol: string;
  activeTimeframe: string;
  activeProfile: string;
  dataReady: boolean;
  insufficientData: boolean;
  symbolCandleCount: number;
  reasoningStepsCount: number;
  qaMessagesCount: number;
  sessionTime: string;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  isAnalyzing: boolean;
  credit?: {
    credits: number;
    hasActiveSubscription: boolean;
    planName: string;
  } | null;
  mode: QuantMode;
  onModeChange: (mode: QuantMode) => void;
  onRun: () => void;
  onStop: () => void;
}

export default function AgentDialogMetaBar({
  symbol,
  activeTimeframe,
  activeProfile,
  dataReady,
  insufficientData,
  symbolCandleCount,
  reasoningStepsCount,
  qaMessagesCount,
  sessionTime,
  selectedModel,
  onModelChange,
  isAnalyzing,
  credit,
  mode,
  onModeChange,
  onRun,
  onStop,
}: AgentDialogMetaBarProps) {
  const symbolLabel = `${symbol} · ${activeTimeframe}`;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-default/40 px-4 py-2.5 bg-elevated/5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-text-primary">{symbolLabel}</span>
        <span className="rounded-sm border border-border-default bg-elevated/60 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-text-muted">
          {isFnoSymbol(symbol) ? 'NFO' : 'NSE'}
        </span>
        <span className="rounded-sm border border-border-default bg-elevated px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-text-secondary">
          {activeProfile}
        </span>
        <span className="text-[9px] text-text-muted">
          {dataReady ? `${symbolCandleCount} candles` : 'Loading candles…'}
          {insufficientData ? ' (low)' : ''}
          {reasoningStepsCount > 0 ? ` · ${reasoningStepsCount} steps` : ''}
          {qaMessagesCount > 0 ? ` · ${qaMessagesCount} messages` : ''}
          {sessionTime ? ` · ${sessionTime}` : ''}
        </span>

        {/* Model Selector badge */}
        <div className="scale-90 origin-left">
          <ModelSelector
            value={selectedModel}
            onChange={onModelChange}
            disabled={isAnalyzing}
            variant="inline"
          />
        </div>

        {/* Credits & plan badge */}
        {credit && (
          <span className="flex items-center gap-1.5 rounded border border-border-default/60 bg-elevated/35 px-2 py-1 text-[9px]">
            <Coins size={10} className="shrink-0 text-amber-400" aria-hidden="true" />
            <span className="font-mono font-semibold text-text-primary">
              {credit.credits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-text-muted">
              credits · {credit.hasActiveSubscription ? credit.planName : 'Pro'}
            </span>
          </span>
        )}
      </div>

      {/* Mode tabs and Primary Action */}
      <div className="flex items-center gap-2">
        <div className="flex rounded bg-elevated/40 p-0.5 border border-border-default/60">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => onModeChange('FIND')}
            className={`rounded px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'FIND'
                ? 'bg-elevated text-text-primary shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Find Trade
          </button>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => onModeChange('VERIFY')}
            className={`rounded px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'VERIFY'
                ? 'bg-elevated text-text-primary shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Verify Setup
          </button>
        </div>

        <button
          type="button"
          disabled={!isAnalyzing && !dataReady}
          onClick={() => {
            if (isAnalyzing) onStop();
            else onRun();
          }}
          className={`flex h-8 items-center justify-center gap-1.5 rounded px-3 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            !dataReady && !isAnalyzing
              ? 'bg-elevated/40 text-text-muted/50 border border-border-default opacity-50 cursor-not-allowed'
              : isAnalyzing
                ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
          }`}
        >
          {!dataReady && !isAnalyzing ? (
            <Loader2 size={11} className="animate-spin text-text-muted" />
          ) : isAnalyzing ? (
            <Square size={11} />
          ) : mode === 'VERIFY' ? (
            <Shield size={11} />
          ) : (
            <Zap size={11} />
          )}
          {!dataReady && !isAnalyzing
            ? 'Awaiting data…'
            : isAnalyzing
              ? 'Stop analysis'
              : mode === 'VERIFY'
                ? 'Verify my setup'
                : 'Find quant trade'}
        </button>
      </div>
    </div>
  );
}

