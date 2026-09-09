'use client';

// Feature: terminal-ux-overhaul (Task 5.2)
//
// SplitChartContainer — the dual-pane chart layout (Requirement 4).
//
// Renders the Split_Chart_View as two fully-independent `ChartPane`s side by
// side, using the terminal's `react-resizable-panels` primitive (the same
// `Group`/`Panel`/`Separator` building blocks and divider styling already used
// by `FnoSection`, so the resize-handle look stays consistent — R5.4, R8.4).
//
// Design decisions honored here:
//   · The two panes come straight from `useChartUIStore.panes` ([A, B]); the
//     container holds no pane state of its own (single source of truth — AD-3,
//     R6.1).
//   · Exactly TWO panes are rendered in this phase — no more (AD-4, R4.2, R7.5).
//     Additional pane counts are deferred to future work.
//   · Each `ChartPane` is given a STABLE React `key` of its pane id, so React
//     never reuses one pane's chart instance for the other when the underlying
//     symbols change — keeping the two chart instances isolated (R4.8).
//   · The container accepts a `mode` prop typed to the split-enabled profiles
//     ('INTRADAY' | 'FNO'); split is only ever mounted in those modes (R4.7,
//     mode-gated at the store boundary and again where this is rendered).

import React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import ChartPane from './ChartPane';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { TradeProfile } from '../../store/useTradeStore';
import { getGridContainerClass, getPaneGridClass, getPaneChromeConfig } from './layoutGridStyles';
import SplitViewToggle from './SplitViewToggle';

/** The workspace profiles in which the Split_Chart_View is available (R4.7). */
export type SplitEnabledProfile = Extract<TradeProfile, 'INTRADAY' | 'FNO'>;

interface SplitChartContainerProps {
  /** The active workspace mode hosting the split view ('INTRADAY' | 'FNO'). */
  mode: SplitEnabledProfile;
}

/**
 * Multi-pane split chart container supporting 1 to 8 charts.
 * For standard 2-vertical split, uses resizable panels.
 * For all other multi-pane configurations, uses structured CSS grid.
 */
export default function SplitChartContainer({ mode }: SplitChartContainerProps) {
  const panes = useChartUIStore((s) => s.panes);
  const activeLayout = useChartUIStore((s) => s.activeLayout);
  const isMobile = useIsMobile();

  // Exactly two panes with vertical split (or default): retain resizable panels
  if ((activeLayout === '2v' || !activeLayout) && panes.length === 2) {
    const [paneA, paneB] = panes;
    const chromeA = getPaneChromeConfig('2v', 0);
    const chromeB = getPaneChromeConfig('2v', 1);

    return (
      <div data-split-mode={mode} className="relative flex h-full w-full min-h-0 flex-col bg-chart-bg">
        <Group orientation={isMobile ? 'vertical' : 'horizontal'} className="h-full w-full min-h-0">
          <Panel defaultSize={50} minSize={20}>
            <ChartPane
              key={paneA.id}
              pane={paneA}
              isSplitPane={true}
              hideLeftToolbar={chromeA.hideLeftToolbar}
              hideTimeframesToolbar={chromeA.hideTimeframesToolbar}
            />
          </Panel>
          <Separator
            className={
              isMobile
                ? 'h-px cursor-row-resize bg-border-default transition-colors hover:bg-emerald-500/40 data-[separator]:h-1'
                : 'w-px cursor-col-resize bg-border-default transition-colors hover:bg-emerald-500/40 data-[separator]:w-1'
            }
          />
          <Panel defaultSize={50} minSize={20}>
            <ChartPane
              key={paneB.id}
              pane={paneB}
              isSplitPane={true}
              hideLeftToolbar={chromeB.hideLeftToolbar}
              hideTimeframesToolbar={chromeB.hideTimeframesToolbar}
            />
          </Panel>
        </Group>

        {/* Bottom-right layout switcher */}
        <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
          <SplitViewToggle
            direction="up"
            label="Layout"
            buttonClassName="flex h-7 items-center gap-1.5 rounded bg-surface/90 px-2.5 text-[11px] font-medium text-text-secondary shadow-lg backdrop-blur-sm border border-border-default hover:bg-elevated hover:text-text-primary transition-all"
          />
        </div>
      </div>
    );
  }

  // Multi-pane layouts (3 to 8 panes, or horizontal split '2h')
  const containerClass = getGridContainerClass(activeLayout);

  return (
    <div data-split-mode={mode} className="relative h-full w-full min-h-0 bg-chart-bg p-0.5">
      <div className={`h-full w-full min-h-0 ${containerClass}`}>
        {panes.map((pane, idx) => {
          const paneClass = getPaneGridClass(activeLayout, idx);
          const chrome = getPaneChromeConfig(activeLayout, idx);
          return (
            <div key={pane.id} className={`h-full w-full min-h-0 overflow-hidden ${paneClass}`}>
              <ChartPane
                pane={pane}
                isSplitPane={true}
                hideLeftToolbar={chrome.hideLeftToolbar}
                hideTimeframesToolbar={chrome.hideTimeframesToolbar}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom-right layout switcher */}
      <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
        <SplitViewToggle
          direction="up"
          label="Layout"
          buttonClassName="flex h-7 items-center gap-1.5 rounded bg-surface/90 px-2.5 text-[11px] font-medium text-text-secondary shadow-lg backdrop-blur-sm border border-border-default hover:bg-elevated hover:text-text-primary transition-all"
        />
      </div>
    </div>
  );
}

