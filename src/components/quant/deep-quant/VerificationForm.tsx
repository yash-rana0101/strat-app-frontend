import React from 'react';
import { Shield, Loader2 } from 'lucide-react';

export interface VerificationFormProps {
  side: 'BUY' | 'SELL';
  setSide: (side: 'BUY' | 'SELL') => void;
  entry: string;
  setEntry: (entry: string) => void;
  setHasManuallySetEntry: (val: boolean) => void;
  stopLoss: string;
  setStopLoss: (sl: string) => void;
  setHasManuallySetSL: (val: boolean) => void;
  takeProfit: string;
  setTakeProfit: (tp: string) => void;
  setHasManuallySetTP: (val: boolean) => void;
  userAnalysis: string;
  setUserAnalysis: (val: string) => void;
  slPercent: string | null;
  tpPercent: string | null;
  riskToReward: string | null;
  onSubmit: () => void;
  isAnalyzing: boolean;
  dataReady: boolean;
}

export default function VerificationForm({
  side,
  setSide,
  entry,
  setEntry,
  setHasManuallySetEntry,
  stopLoss,
  setStopLoss,
  setHasManuallySetSL,
  takeProfit,
  setTakeProfit,
  setHasManuallySetTP,
  userAnalysis,
  setUserAnalysis,
  slPercent,
  tpPercent,
  riskToReward,
  onSubmit,
  isAnalyzing,
  dataReady,
}: VerificationFormProps) {
  return (
    <div className="mx-3 mt-3 p-3 rounded-lg border border-border-default bg-surface flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border-default pb-1.5">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Configure Setup</span>
        <span className="text-[9px] text-text-muted">Auto-filled via NSE LTP</span>
      </div>

      {/* Side selector */}
      <div className="flex rounded-md bg-muted p-0.5 border border-border-default">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`flex-grow py-1 rounded text-[10px] font-bold transition-all ${
            side === 'BUY'
              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          BUY / LONG
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`flex-grow py-1 rounded text-[10px] font-bold transition-all ${
            side === 'SELL'
              ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          SELL / SHORT
        </button>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-semibold text-text-secondary uppercase">Entry Price</label>
          <input
            type="number"
            step="any"
            value={entry}
            onChange={(e) => {
              setEntry(e.target.value);
              setHasManuallySetEntry(true);
            }}
            className="w-full bg-elevated border border-border-default rounded-md px-2 py-1 text-xs text-text-primary font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-semibold text-text-secondary uppercase">Stop Loss</label>
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => {
              setStopLoss(e.target.value);
              setHasManuallySetSL(true);
            }}
            className={`w-full bg-elevated border rounded-md px-2 py-1 text-xs text-text-primary font-mono focus:outline-none ${
              side === 'BUY'
                ? 'border-border-default focus:border-rose-500'
                : 'border-border-default focus:border-emerald-500'
            }`}
          />
          {slPercent && (
            <span
              className={`text-[8px] self-end font-mono ${
                parseFloat(slPercent) < 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {slPercent}%
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-semibold text-text-secondary uppercase">Take Profit</label>
          <input
            type="number"
            step="any"
            value={takeProfit}
            onChange={(e) => {
              setTakeProfit(e.target.value);
              setHasManuallySetTP(true);
            }}
            className={`w-full bg-elevated border rounded-md px-2 py-1 text-xs text-text-primary font-mono focus:outline-none ${
              side === 'BUY'
                ? 'border-border-default focus:border-emerald-500'
                : 'border-border-default focus:border-rose-500'
            }`}
          />
          {tpPercent && (
            <span
              className={`text-[8px] self-end font-mono ${
                parseFloat(tpPercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {parseFloat(tpPercent) >= 0 ? '+' : ''}
              {tpPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Risk-to-Reward Badge */}
      {riskToReward && (
        <div className="flex justify-between items-center rounded-md bg-muted p-2 border border-border-default text-[10px]">
          <span className="text-text-secondary font-semibold">Risk:Reward Ratio</span>
          <span
            className="font-black font-mono px-2 py-0.5 rounded bg-elevated text-text-primary border border-border-default"
          >
            1 : {riskToReward}
          </span>
        </div>
      )}

      {/* User Analysis Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-[8px] font-semibold text-text-secondary uppercase">My Analysis Notes / Setup Rationale</label>
        <textarea
          rows={3}
          value={userAnalysis}
          onChange={(e) => setUserAnalysis(e.target.value)}
          placeholder="E.g. Bullish engulfing on 10m VWAP bounce, expecting target resistance test..."
          className="w-full bg-elevated border border-border-default rounded-md px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted/65 focus:border-emerald-500 focus:outline-none resize-none"
        />
      </div>

      {/* Verify Button */}
      <button
        type="button"
        disabled={isAnalyzing || !dataReady}
        onClick={onSubmit}
        className={`
          w-full flex h-8 items-center justify-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm
          ${(isAnalyzing || !dataReady)
            ? 'bg-elevated text-text-muted/50 border border-border-default opacity-50 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-600 hover:border-emerald-500 active:scale-[0.98]'
          }
        `}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={12} className="animate-spin text-white" />
            VERIFYING SETUP...
          </>
        ) : (
          <>
            <Shield size={12} className="animate-pulse text-white" />
            VERIFY MY SETUP
          </>
        )}
      </button>
    </div>
  );
}
