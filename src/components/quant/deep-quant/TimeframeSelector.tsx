'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { useTradeStore, type ChartTimeframe } from '../../../store/useTradeStore';
import { useChartUIStore } from '../../../store/useChartUIStore';
import { TIMEFRAME_GROUPS } from './timeframeConstants';

export interface TimeframeSelectorProps {
  symbol: string;
  activeTimeframe: string;
  symbolCandleCount: number;
  dataReady: boolean;
  insufficientData?: boolean;
  disabled?: boolean;
  variant?: 'footer' | 'compact';
  className?: string;
}

export default function TimeframeSelector({
  symbol,
  activeTimeframe,
  symbolCandleCount,
  dataReady,
  insufficientData = false,
  disabled = false,
  variant = 'footer',
  className = '',
}: TimeframeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState<{ left: number; top?: number; bottomOffset?: number }>({
    left: 0,
  });
  const [openDirection, setOpenDirection] = useState<'up' | 'down'>('up');
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (triggerRef.current?.contains(t)) return;
      if (t.closest('[data-timeframe-portal]')) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      const panelWidth = 210;
      const panelHeight = 360;
      const clampedLeft = Math.min(r.left, window.innerWidth - panelWidth - 8);

      if (spaceBelow >= panelHeight || spaceBelow >= spaceAbove) {
        setOpenDirection('down');
        setPanelPos({ left: Math.max(8, clampedLeft), top: r.bottom + 6 });
      } else {
        setOpenDirection('up');
        setPanelPos({
          left: Math.max(8, clampedLeft),
          bottomOffset: window.innerHeight - r.top + 6,
        });
      }
    }
    setOpen((o) => !o);
  };

  const handleSelect = (tf: ChartTimeframe) => {
    useTradeStore.getState().setActiveTimeframe(tf);
    const activePaneId = useChartUIStore.getState().activePaneId;
    if (activePaneId) {
      useChartUIStore.getState().setPaneTimeframe(activePaneId, tf);
    }
    setOpen(false);
  };

  const buttonTitle = `${symbol} • ${activeTimeframe} • Click to change timeframe`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={buttonTitle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          className ||
          (variant === 'compact'
            ? 'flex items-center gap-1 bg-elevated/35 border border-border-default/60 px-1.5 py-0.5 rounded text-[9px] text-text-muted hover:text-text-primary hover:bg-elevated/65 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none'
            : 'flex-1 min-w-[100px] h-7 flex items-center justify-between rounded bg-elevated/35 border border-border-default/60 px-2 py-1 text-[9px] text-text-muted hover:text-text-primary hover:bg-elevated/65 hover:border-border-default/90 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none')
        }
      >
        <span className="truncate">
          {symbol} • <span className="font-semibold text-text-primary">{activeTimeframe}</span> •{' '}
          {!dataReady
            ? 'Loading…'
            : insufficientData
              ? `${symbolCandleCount} candles (low)`
              : `${symbolCandleCount} candles`}
        </span>
        <ChevronDown
          size={10}
          className={`text-text-muted shrink-0 ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            data-timeframe-portal
            role="listbox"
            aria-label="Select timeframe"
            style={{
              position: 'fixed',
              left: panelPos.left,
              ...(openDirection === 'down'
                ? { top: panelPos.top }
                : { bottom: panelPos.bottomOffset }),
            }}
            className="z-[9999] w-[210px] max-h-[380px] overflow-y-auto overflow-x-hidden bg-surface border border-border-default shadow-2xl rounded-md scrollbar-thin py-1"
          >
            {TIMEFRAME_GROUPS.map((group) => (
              <div key={group.category} className="mb-1 last:mb-0">
                <div className="px-2.5 py-1 text-[8.5px] font-bold tracking-wider text-text-muted/60 uppercase select-none border-b border-border-default/30">
                  {group.category}
                </div>
                <div className="py-0.5">
                  {group.options.map((opt) => {
                    const isSelected = activeTimeframe === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt.value)}
                        className={`flex w-full items-center justify-between px-2.5 py-1 text-left text-[10.5px] transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-text-secondary hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[9px] font-mono text-text-muted px-1 py-0.2 rounded bg-elevated/60">
                            {opt.value}
                          </span>
                          {isSelected && <Check size={11} className="text-emerald-500 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
