'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useTradeStore, type ChartTimeframe } from '../../store/useTradeStore';
import { getChartWidget } from '../../utils/tvDrawingToolSync';
import { TIMEFRAME_TO_RESOLUTION } from '../../utils/tvThemeOverrides';
import ChartTypeSelector from './ChartTypeSelector';
import SplitViewToggle from './SplitViewToggle';
import type { ChartType } from '../../charting/engines';

const QUICK_TIMEFRAMES: ChartTimeframe[] = ['1m', '5m', '15m', '1h', '1D'];
const EXTRA_TIMEFRAMES: ChartTimeframe[] = ['2m', '3m', '10m', '30m', '75m', '125m', '2h', '4h', '1W'];

export default function SplitChartHeader(): React.JSX.Element {
  const panes = useChartUIStore((s) => s.panes);
  const activePaneId = useChartUIStore((s) => s.activePaneId);
  const setActivePane = useChartUIStore((s) => s.setActivePane);
  const setPaneSymbol = useChartUIStore((s) => s.setPaneSymbol);
  const setPaneTimeframe = useChartUIStore((s) => s.setPaneTimeframe);
  const setPaneChartType = useChartUIStore((s) => s.setPaneChartType);
  const layoutSync = useChartUIStore((s) => s.layoutSync);

  const activePane = panes.find((p) => p.id === activePaneId) || panes[0];
  const activeSymbol = activePane?.symbol || useTradeStore.getState().selectedSymbol || 'RELIANCE';
  const activeTimeframe = (activePane?.timeframe || '15m') as ChartTimeframe;
  const activeChartType = (activePane?.chartType || 'candlestick') as ChartType;

  // Symbol edit input state
  const [isEditingSymbol, setIsEditingSymbol] = useState(false);
  const [symbolInput, setSymbolInput] = useState(activeSymbol);
  const symbolInputRef = useRef<HTMLInputElement>(null);

  // Extra timeframes dropdown state
  const [tfDropdownOpen, setTfDropdownOpen] = useState(false);
  const tfDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSymbolInput(activeSymbol);
  }, [activeSymbol]);

  useEffect(() => {
    if (isEditingSymbol) {
      symbolInputRef.current?.focus();
      symbolInputRef.current?.select();
    }
  }, [isEditingSymbol]);

  // Close timeframe dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tfDropdownRef.current && !tfDropdownRef.current.contains(e.target as Node)) {
        setTfDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleApplySymbol = (sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (!clean) return;
    setPaneSymbol(activePaneId, clean);
    const widget = getChartWidget(activePaneId);
    if (widget) {
      const isFno = clean.endsWith('FUT') || ((clean.endsWith('CE') || clean.endsWith('PE')) && /\d/.test(clean));
      const exchange = isFno ? 'NFO' : 'NSE';
      widget.activeChart().setSymbol(`${exchange}:${clean}`);
    }
    if (layoutSync.symbol) {
      panes.forEach((p) => {
        if (p.id !== activePaneId) {
          setPaneSymbol(p.id, clean);
          const w = getChartWidget(p.id);
          const isFno = clean.endsWith('FUT') || ((clean.endsWith('CE') || clean.endsWith('PE')) && /\d/.test(clean));
          const exchange = isFno ? 'NFO' : 'NSE';
          w?.activeChart().setSymbol(`${exchange}:${clean}`);
        }
      });
    }
    setIsEditingSymbol(false);
  };

  const handleSelectTimeframe = (tf: ChartTimeframe) => {
    setPaneTimeframe(activePaneId, tf);
    const widget = getChartWidget(activePaneId);
    if (widget) {
      widget.activeChart().setResolution(TIMEFRAME_TO_RESOLUTION[tf] ?? '15');
    }
    if (layoutSync.interval) {
      panes.forEach((p) => {
        if (p.id !== activePaneId) {
          setPaneTimeframe(p.id, tf);
          getChartWidget(p.id)?.activeChart().setResolution(TIMEFRAME_TO_RESOLUTION[tf] ?? '15');
        }
      });
    }
    setTfDropdownOpen(false);
  };

  const handleOpenIndicators = () => {
    const widget = getChartWidget(activePaneId);
    try {
      (widget?.activeChart() as any)?.executeActionById?.('insert_indicator');
    } catch (err) {
      console.warn('[SplitChartHeader] Failed to open indicator dialog:', err);
    }
  };

  return (
    <div className="relative z-20 flex h-9 w-full shrink-0 items-center justify-between border-b border-border-default bg-surface px-2 text-xs select-none">
      {/* Left Section: Active Pane Tabs, Symbol, Timeframe, Chart Style, Indicators */}
      <div className="flex h-full items-center gap-1.5 overflow-x-auto no-scrollbar">
        {/* Active Pane Indicator Pills */}
        <div className="flex items-center gap-1 border-r border-border-default pr-2">
          {panes.map((p, idx) => {
            const isSelected = p.id === activePaneId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePane(p.id)}
                title={`Select Chart ${idx + 1} (${p.symbol || 'Default'})`}
                className={`flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/50'
                    : 'text-text-muted hover:bg-elevated hover:text-text-primary'
                }`}
              >
                <span>Chart {idx + 1}</span>
                {p.symbol && <span className="opacity-70 text-[10px]">({p.symbol})</span>}
              </button>
            );
          })}
        </div>

        {/* Symbol Search / Display */}
        <div className="flex items-center">
          {isEditingSymbol ? (
            <input
              ref={symbolInputRef}
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplySymbol(symbolInput);
                if (e.key === 'Escape') setIsEditingSymbol(false);
              }}
              onBlur={() => handleApplySymbol(symbolInput)}
              className="h-6 w-28 rounded bg-elevated px-2 text-[11px] font-bold text-text-primary outline-none ring-1 ring-emerald-500 uppercase"
              placeholder="SYMBOL"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingSymbol(true)}
              title="Search symbol for active chart"
              className="flex h-6 items-center gap-1 rounded px-2 text-[11px] font-bold text-text-primary hover:bg-elevated transition-colors"
            >
              <Search size={12} className="text-text-muted" />
              <span>{activeSymbol}</span>
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-border-default/60" />

        {/* Quick Timeframes */}
        <div className="flex items-center gap-0.5">
          {QUICK_TIMEFRAMES.map((tf) => {
            const isSelected = activeTimeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => handleSelectTimeframe(tf)}
                className={`h-6 rounded px-1.5 text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-500 font-bold'
                    : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
                }`}
              >
                {tf}
              </button>
            );
          })}

          {/* More Timeframes Dropdown */}
          <div className="relative" ref={tfDropdownRef}>
            <button
              type="button"
              onClick={() => setTfDropdownOpen(!tfDropdownOpen)}
              title="More intervals"
              className="flex h-6 w-5 items-center justify-center rounded text-text-secondary hover:bg-elevated hover:text-text-primary"
            >
              <ChevronDown size={11} className={`transition-transform ${tfDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {tfDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 grid grid-cols-3 gap-1 rounded border border-border-default bg-surface/98 p-1.5 shadow-xl backdrop-blur-xl">
                {EXTRA_TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => handleSelectTimeframe(tf)}
                    className={`h-6 rounded px-2 text-[11px] font-medium transition-colors ${
                      activeTimeframe === tf
                        ? 'bg-emerald-500/15 text-emerald-500 font-bold'
                        : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-4 w-px bg-border-default/60" />

        {/* Chart Type Selector */}
        <div className="h-6 flex items-center">
          <ChartTypeSelector
            value={activeChartType}
            onSelect={(t) => setPaneChartType(activePaneId, t)}
          />
        </div>

        <div className="h-4 w-px bg-border-default/60" />

        {/* Indicators Button */}
        <button
          type="button"
          onClick={handleOpenIndicators}
          title="Open Indicators on active chart"
          className="flex h-6 items-center gap-1.5 rounded px-2 text-[11px] font-medium text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
        >
          <span className="font-serif italic font-bold text-emerald-500 text-[12px]">fx</span>
          <span>Indicators</span>
        </button>
      </div>

      {/* Right Section: Split View / Layout Selector */}
      <div className="flex h-full items-center gap-1">
        <SplitViewToggle
          direction="down"
          label="Layout"
          buttonClassName="flex h-6 items-center gap-1.5 rounded bg-surface px-2 text-[11px] font-medium text-text-secondary hover:bg-elevated hover:text-text-primary transition-all"
        />
      </div>
    </div>
  );
}
