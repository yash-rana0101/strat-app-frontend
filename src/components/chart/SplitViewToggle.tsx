'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useOutsideClose } from '../../hooks/useOutsideClose';
import { ChartLayoutDropdown } from './ChartLayoutDropdown';
import { LayoutIcon } from './LayoutIcon';

/**
 * Single / Split dropdown toggle for the chart command bar (Requirement 4).
 *
 * Switches the chart area between a single chart and multi-pane
 * Split_Chart_View layouts (1 to 8 charts) and provides layout synchronization controls.
 *
 * The control is mode-gated (R4.7, R5.3): it renders only when the active
 * workspace profile is INTRADAY or FNO. In Swing / Investor it returns null
 * (hidden).
 */
export interface SplitViewToggleProps {
  noText?: boolean;
  direction?: 'up' | 'down';
  label?: string;
  className?: string;
  buttonClassName?: string;
}

export default function SplitViewToggle({
  noText = false,
  direction = 'down',
  label,
  className = '',
  buttonClassName,
}: SplitViewToggleProps) {
  const activeProfile = useTradeStore((s) => s.activeProfile);
  const splitView = useChartUIStore((s) => s.splitView);
  const activeLayout = useChartUIStore((s) => s.activeLayout);
  const layoutSync = useChartUIStore((s) => s.layoutSync);
  const setLayout = useChartUIStore((s) => s.setLayout);
  const setLayoutSync = useChartUIStore((s) => s.setLayoutSync);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(() => setIsOpen(false));

  // Mode-gated: only Intraday and F&O support the split view (R4.7, R5.3).
  if (activeProfile !== 'INTRADAY' && activeProfile !== 'FNO') {
    return null;
  }

  const defaultBtnClass = noText
    ? `flex h-7 w-7 items-center justify-center rounded-sm transition-all ${
        isOpen
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-transparent text-text-secondary hover:bg-elevated hover:text-text-primary'
      }`
    : `flex h-full items-center gap-1.5 px-2.5 text-[11px] font-semibold transition-all border-r border-border-default ${
        isOpen
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-surface text-text-secondary hover:bg-elevated hover:text-text-primary'
      }`;

  const displayText = label !== undefined ? label : splitView ? 'Split' : 'Single';

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      ref={ref}
      role="group"
      aria-label="Chart layout"
    >
      <button
        type="button"
        id="split-view-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title={noText ? `Layout: ${splitView ? activeLayout : 'Single'}` : undefined}
        className={buttonClassName || defaultBtnClass}
      >
        <LayoutIcon
          id={splitView ? activeLayout : '1'}
          size={noText ? 18 : 14}
          className={isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}
        />
        {!noText && <span>{displayText}</span>}
        {!noText && (
          <ChevronDown
            size={11}
            className={`transition-transform duration-200 ${
              isOpen ? (direction === 'up' ? '' : 'rotate-180') : (direction === 'up' ? 'rotate-180' : '')
            }`}
          />
        )}
      </button>

      {/* Dropdown Options (always rendered in DOM for unit test compatibility, hidden via class when closed) */}
      <div
        className={`absolute right-0 z-50 ${
          isOpen ? 'block' : 'hidden'
        } ${direction === 'up' ? 'bottom-full mb-1.5' : noText ? 'top-[32px]' : 'top-full mt-1'}`}
      >
        <ChartLayoutDropdown
          activeLayout={activeLayout}
          syncSettings={layoutSync}
          onSelectLayout={(id) => {
            setLayout(id);
            setIsOpen(false);
          }}
          onToggleSync={setLayoutSync}
        />
      </div>
    </div>
  );
}
