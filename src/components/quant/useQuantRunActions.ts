'use client';

// components/quant/useQuantRunActions.ts
//
// The run controls, extracted from `DeepQuantPanel` so the sidebar and the Agent View dialog
// press the SAME code rather than each holding a copy.
//
// Nothing here is new behaviour. `handleFind`, `handleVerify` and the derived `dataReady` /
// `symbolCandleCount` values are the panel's originals, moved verbatim — including the parallel
// `fetchConsensusForSymbol` call and the reason it fires on the button press rather than on
// symbol change. A second copy of this in the dialog is exactly how the two surfaces would drift
// into disagreeing about when the button is enabled.

import { useMemo } from 'react';

import { useQuantStore } from '../../store/useQuantStore';
import { useTradeStore } from '../../store/useTradeStore';
import { useFqIsAnalyzing } from './useFqSession';

export interface QuantRunActions {
  /** The symbol every run and label is bound to. `selectedSymbol` with the panel's fallback. */
  symbol: string;
  activeTimeframe: string;
  /** How many candles the cache holds for this symbol, across every timeframe key. */
  symbolCandleCount: number;
  /** The gate on the primary button: no candles means the agent has nothing to read. */
  dataReady: boolean;
  /** Enough to run, but thin enough that the caller should say so. */
  insufficientData: boolean;
  isAnalyzing: boolean;
  /** FIND. Resets the transcript, computes consensus alongside, starts the run. */
  handleFind: () => void;
  /** VERIFY. Same, plus the user's own levels. Ignores a non-positive entry, as before. */
  handleVerify: (input: {
    side: string;
    entry: string;
    stopLoss: string;
    takeProfit: string;
    userAnalysis: string;
  }) => void;
  cancelAnalysis: () => void;
}

export function useQuantRunActions(): QuantRunActions {
  const selectedSymbol = useTradeStore((s) => s.selectedSymbol);
  const historicalCache = useTradeStore((s) => s.historicalCache);
  const activeTimeframe = useTradeStore((s) => s.activeTimeframe);
  const isAnalyzing = useFqIsAnalyzing();
  const cancelAnalysis = useQuantStore((s) => s.cancelAnalysis);

  const symbol = selectedSymbol || 'RELIANCE';

  // ── AI Handoff State Guard ──────────────────────────────────────────────
  // The cache is keyed `SYMBOL::timeframe::interval`, so this scans by prefix and takes the
  // widest series available for the symbol — a 10m series with history is enough to run on even
  // when the currently-selected timeframe has none yet.
  const symbolCandleCount = useMemo(() => {
    const symUpper = symbol.toUpperCase();
    let maxCount = 0;
    for (const [key, val] of Object.entries(historicalCache)) {
      if (key.startsWith(`${symUpper}::`) && val && val.length > maxCount) {
        maxCount = val.length;
      }
    }
    return maxCount;
  }, [historicalCache, symbol]);

  const dataReady = symbolCandleCount > 0;
  const insufficientData = symbolCandleCount > 0 && symbolCandleCount < 50;

  const handleFind = () => {
    useQuantStore.getState().resetTerminal();
    // Compute the technical consensus for THIS press, alongside the agent run.
    //
    // Deliberately here and not on symbol change: it is a technical read the user asks for, so a
    // watchlist click should not fire a tool-server computation per symbol, and an agent-run
    // output should not be presented as ambient telemetry.
    //
    // Fired in parallel rather than awaited — the agent stream is the primary result and must not
    // wait on the HUD. If the agent's own `get_consensus_report` tool result arrives first,
    // `quant-consensus` sets the same state; whichever lands later simply wins with equivalent
    // data.
    void useQuantStore.getState().fetchConsensusForSymbol(symbol, activeTimeframe);
    useQuantStore.getState().fetchDeepAnalysis(symbol);
  };

  const handleVerify: QuantRunActions['handleVerify'] = ({
    side,
    entry,
    stopLoss,
    takeProfit,
    userAnalysis,
  }) => {
    const entryNum = parseFloat(entry);
    const slNum = parseFloat(stopLoss);
    const tpNum = parseFloat(takeProfit);

    if (isNaN(entryNum) || entryNum <= 0) {
      console.warn('Invalid entry price');
      return;
    }

    useQuantStore.getState().resetTerminal();
    // VERIFY reads the same consensus indicators (ATR sizes the stop, RSI/MACD/EMA corroborate
    // the user's direction), so the HUD is populated for this press too — same reasoning as
    // handleFind above.
    void useQuantStore.getState().fetchConsensusForSymbol(symbol, activeTimeframe);
    useQuantStore.getState().fetchDeepAnalysis(symbol, 'VERIFY', {
      side,
      entry: entryNum,
      stopLoss: slNum,
      takeProfit: tpNum,
      userAnalysis,
    });
  };

  return {
    symbol,
    activeTimeframe,
    symbolCandleCount,
    dataReady,
    insufficientData,
    isAnalyzing,
    handleFind,
    handleVerify,
    cancelAnalysis,
  };
}
