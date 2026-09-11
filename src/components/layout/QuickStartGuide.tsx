'use client';

/**
 * First-run product tour. It is mounted only with the authenticated terminal,
 * so the automatic tour cannot start over the auth or connection-health screens.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { driver, type DriveStep, type Driver } from 'driver.js';
import { useAuthStore } from '../../store/useAuthStore';
import { PROFILES } from '../../utils/layoutHelpers';

interface QuickStartGuideProps {
  open: boolean;
  onClose: () => void;
}

const TOUR_STORAGE_KEY = 'stratai.onboarding-tour.v1';
export const REPLAY_TOUR_EVENT = 'stratai:replay-onboarding-tour';

type AnalysisMode = 'FIND' | 'VERIFY';

interface TradeTourState {
  originalMode: AnalysisMode | null;
}

function visibleElement(selector: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(selector)).find((target) => {
      const bounds = target.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    }) ?? null
  );
}

function waitForVisible(selector: string, timeoutMs = 1200): Promise<HTMLElement | null> {
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const check = () => {
      const target = visibleElement(selector);
      if (target || performance.now() - startedAt >= timeoutMs) {
        resolve(target);
        return;
      }
      window.requestAnimationFrame(check);
    };
    check();
  });
}

async function openDeepQuantPanel(triggerSelector: string): Promise<HTMLElement | null> {
  const mountedActions = visibleElement('[data-tour="deep-quant-actions"]');
  if (mountedActions) return mountedActions;

  visibleElement(triggerSelector)?.click();
  return waitForVisible('[data-tour="deep-quant-actions"]');
}

async function selectAnalysisMode(mode: AnalysisMode): Promise<boolean> {
  const actions = visibleElement('[data-tour="deep-quant-actions"]');
  if (!actions) return false;
  if (actions.dataset.analysisMode === mode) return true;
  if (actions.dataset.analysisState !== 'idle') return false;

  visibleElement('[data-tour="deep-quant-mode-toggle"]')?.click();
  const option = await waitForVisible(
    mode === 'FIND' ? '[data-tour="find-trade-option"]' : '[data-tour="verify-trade-option"]',
    600
  );
  option?.click();

  const updatedActions = await waitForVisible(
    `[data-tour="deep-quant-actions"][data-analysis-mode="${mode}"]`,
    600
  );
  return updatedActions !== null;
}

function moveWhenActive(tour: Driver, direction: 'next' | 'previous' = 'next') {
  if (!tour.isActive()) return;
  if (direction === 'next') tour.moveNext();
  else tour.movePrevious();
}

const step = (
  element: string | undefined,
  title: string,
  description: string,
  side: 'top' | 'right' | 'bottom' | 'left' = 'right'
): DriveStep => ({
  element,
  popover: { title, description, side, align: 'center' },
});

function tradeActionSteps(
  triggerSelector: string,
  side: 'left' | 'top',
  state: TradeTourState
): DriveStep[] {
  const dynamicStep = (
    element: string,
    title: string,
    description: string,
    popover: DriveStep['popover'] = {}
  ): DriveStep => ({
    element,
    data: { dynamic: true },
    waitForElement: 1200,
    skipMissingElement: true,
    popover: { title, description, side, align: 'center', ...popover },
  });

  return [
    {
      ...step(
        triggerSelector,
        'Strat AI Agent',
        'Open the AI workspace to find a new setup or verify your own trade thesis. Runs stream their reasoning, can watch price conditions, and accept follow-up Q&A when available. Plan access and credits may apply.',
        side
      ),
      popover: {
        title: 'Strat AI Agent',
        description:
          'Open the AI workspace to find a new setup or verify your own trade thesis. Runs stream their reasoning, can watch price conditions, and accept follow-up Q&A when available. Plan access and credits may apply.',
        side,
        align: 'center',
        onNextClick: (_element, _step, { driver: tour }) => {
          void (async () => {
            const actions = await openDeepQuantPanel(triggerSelector);
            if (!tour.isActive()) return;
            if (!actions || actions.dataset.analysisState !== 'idle') {
              tour.moveTo((tour.getActiveIndex() ?? 0) + 5);
              return;
            }
            const currentMode = actions?.dataset.analysisMode;
            if (
              state.originalMode === null &&
              (currentMode === 'FIND' || currentMode === 'VERIFY')
            ) {
              state.originalMode = currentMode;
            }
            if (await selectAnalysisMode('FIND')) moveWhenActive(tour);
            else tour.moveTo((tour.getActiveIndex() ?? 0) + 5);
          })();
        },
      },
    },
    dynamicStep(
      '[data-tour="deep-quant-actions"][data-analysis-mode="FIND"][data-analysis-state="idle"] [data-tour="deep-quant-run-action"]',
      'Find Trade',
      'This action scans the selected symbol and timeframe using the available candle data, then streams its quantitative reasoning and proposed setup. It may wait for a live price condition, but it never places an order. If data is still loading, the button shows Awaiting Data.',
      {
        onPrevClick: (_element, _step, { driver: tour }) => {
          moveWhenActive(tour, 'previous');
        },
      }
    ),
    dynamicStep(
      '[data-tour="deep-quant-actions"][data-analysis-state="idle"] [data-tour="deep-quant-mode-toggle"]',
      'Choose Find or Verify',
      'Use this mode picker to switch between searching for a setup and reviewing one you already planned. Next, the tour selects Verify My Trade Idea through this same picker.',
      {
        onNextClick: (_element, _step, { driver: tour }) => {
          void (async () => {
            await selectAnalysisMode('VERIFY');
            moveWhenActive(tour);
          })();
        },
        onPrevClick: (_element, _step, { driver: tour }) => {
          void (async () => {
            await selectAnalysisMode('FIND');
            moveWhenActive(tour, 'previous');
          })();
        },
      }
    ),
    dynamicStep(
      '[data-tour="verify-trade-form"]',
      'Describe your trade setup',
      'Choose BUY / LONG or SELL / SHORT, then review or edit the entry, stop loss, and take-profit levels. Add your own setup rationale so the critique can address the thesis. Percentages and risk-to-reward update from these values.'
    ),
    dynamicStep(
      '[data-tour="verify-trade-submit"]',
      'Verify My Setup',
      'This asks the agent to challenge your thesis, levels, and risk instead of searching for a different trade. The critique streams into the panel and does not place an order.',
      {
        onNextClick: (_element, _step, { driver: tour }) => {
          void (async () => {
            if (state.originalMode) await selectAnalysisMode(state.originalMode);
            moveWhenActive(tour);
          })();
        },
      }
    ),
  ];
}

function desktopSteps(tradeState: TradeTourState): DriveStep[] {
  return [
    step(
      undefined,
      'Welcome to Strat AI',
      'This short tour maps the terminal before you begin. It explains where to find instruments, charts, live analysis, workspace intelligence, alerts, and account controls.'
    ),
    step(
      '[data-tour="search"]',
      'Find an instrument',
      'Search NSE equities and NFO contracts here. You can also press Ctrl+K, Cmd+K, /, or simply start typing while no form field is focused.'
    ),
    step(
      '[data-tour="watchlist-toggle"]',
      'Show or hide Market Watch',
      'This control gives chart space back without losing your watchlist. Press it again whenever you need the symbol list.'
    ),
    step(
      '[data-tour="watchlist-panel"]',
      'Market Watch',
      'Monitor live quotes, select the symbol sent to the active chart, reorder instruments, remove entries, and manually retry a failed quote refresh. The panel edge is draggable.'
    ),
    step(
      '[data-tour="workspaces"]',
      'Choose a trading workspace',
      `Switch the entire context between ${PROFILES.map((profile) => profile.label).join(', ')}. Intraday shows market depth, Swing shows multi-timeframe confluence, Investor shows macro context, and F&O exposes underlying, expiry, option-chain, and contract analytics.`
    ),
    step(
      '[data-tour="market-ticker"]',
      'Live market context',
      'When macro readings are available, this strip keeps index and market indicators visible without covering the chart.'
    ),
    step(
      '[data-tradingview-container="true"]',
      'Advanced chart workspace',
      'Use the chart for candles, timeframes, drawings, indicators, layouts, volume profile, footprint, and Ghostline projections when enabled. Its toolbar runs inside the chart itself, so this tour highlights it as one workspace.',
      'bottom'
    ),
    step(
      '[data-tour="analysis-summary"]',
      'AI analysis summary',
      'These compact readings show news sentiment, technical consensus, and multi-timeframe patterns for the selected symbol. Select a reading to open its detailed sheet.',
      'right'
    ),
    step(
      '[data-tour="workspace-intelligence"]',
      'Workspace intelligence',
      'Open the panel matched to the active mode: five-level order-book depth, swing confluence, investor macro sentiment, or the F&O option chain. Selecting the active icon again closes the panel.',
      'left'
    ),
    ...tradeActionSteps('[data-tour="ai-agent"]', 'left', tradeState),
    step(
      '[data-tour="quant-radar"]',
      'Quant Radar',
      'Track several symbols on one timeframe, scan for candlestick patterns and institutional strategies, and select a detection to visualize it on the chart.'
    ),
    step(
      '[data-tour="notifications"]',
      'Session notifications',
      'Real feed warnings and errors appear here. The unread badge is shown only when this session has something actionable to report.'
    ),
    step(
      '[data-tour="theme"]',
      'Light or dark theme',
      'Switch the terminal theme here. Your choice is saved for future visits.'
    ),
    step(
      '[data-tour="account"]',
      'Account and subscription',
      'Open your profile, plan and credit details, billing history, and sign-out controls.'
    ),
    step(
      '[data-tour="help"]',
      'Replay this tour anytime',
      'Select Help whenever you want this walkthrough again. You are ready to explore the terminal.'
    ),
  ];
}

function mobileSteps(tradeState: TradeTourState): DriveStep[] {
  return [
    step(
      undefined,
      'Welcome to Strat AI',
      'The mobile terminal keeps the same market tools in five focused destinations. This quick tour shows where each one lives.'
    ),
    step(
      '[data-tour="mobile-chart-header"]',
      'Chart controls',
      'See the active symbol, timeframe, exchange, and trading mode here. Tap the symbol or search icon to change instruments, and use the right control for fullscreen.'
    ),
    step(
      '[data-tradingview-container="true"]',
      'Advanced chart',
      'Study candles, drawings, indicators, layouts, volume profile, footprint, and Ghostline projections when enabled. Chart tools live inside this workspace.',
      'bottom'
    ),
    step(
      '[data-tour="mobile-nav"]',
      'Five focused destinations',
      'The bottom bar keeps Chart, Watch, AI Agent, Book, and Profile one tap away. Switching tabs does not discard your chart selection.',
      'top'
    ),
    step(
      '[data-tour="mobile-watchlist"]',
      'Watch',
      'Search instruments, monitor live quotes, choose what is charted, reorder symbols, and review the sentiment, technical, and pattern summaries.',
      'top'
    ),
    ...tradeActionSteps('[data-tour="mobile-agent"]', 'top', tradeState),
    step(
      '[data-tour="mobile-orderbook"]',
      'Book and intelligence',
      'This destination adapts to the selected mode: market depth for Intraday, confluence for Swing, macro outlook for Investor, and option-chain tools for F&O.',
      'top'
    ),
    step(
      '[data-tour="mobile-profile"]',
      'Profile, mode, credits, and help',
      'Choose a trading mode, review account and plan details, inspect billing, sign out, or use Replay app tour in Profile whenever you need this walkthrough again.',
      'top'
    ),
  ];
}

function availableSteps(steps: DriveStep[]): DriveStep[] {
  return steps.filter(({ element, data }) => {
    if (data?.dynamic) return true;
    if (typeof element !== 'string') return true;
    return visibleElement(element) !== null;
  });
}

export default function QuickStartGuide({ open, onClose }: QuickStartGuideProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const storageKey = userId ? `${TOUR_STORAGE_KEY}:${userId}` : TOUR_STORAGE_KEY;
  const driverRef = useRef<Driver | null>(null);
  const onCloseRef = useRef(onClose);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const startTour = useCallback(() => {
    if (driverRef.current?.isActive()) return;

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const tradeState: TradeTourState = { originalMode: null };
    const steps = availableSteps(
      isDesktop ? desktopSteps(tradeState) : mobileSteps(tradeState)
    );
    if (steps.length === 0) return;

    startedRef.current = true;
    const tour = driver({
      steps,
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      smoothScroll: false,
      allowClose: true,
      allowKeyboardControl: true,
      disableActiveInteraction: true,
      overlayColor: '#020617',
      overlayOpacity: 0.72,
      stagePadding: isDesktop ? 6 : 4,
      stageRadius: 8,
      popoverOffset: 12,
      popoverClass: 'app-tour-popover',
      showButtons: ['previous', 'next', 'close'],
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Start exploring',
      onDestroyed: () => {
        driverRef.current = null;
        if (tradeState.originalMode) void selectAnalysisMode(tradeState.originalMode);
        try {
          localStorage.setItem(storageKey, 'complete');
        } catch {
          // Storage can be unavailable in private browsing or embedded contexts.
        }
        if (mountedRef.current) onCloseRef.current();
      },
    });

    driverRef.current = tour;
    tour.drive();
  }, [storageKey]);

  useEffect(() => {
    mountedRef.current = true;
    const replay = () => startTour();
    window.addEventListener(REPLAY_TOUR_EVENT, replay);

    let hasCompletedTour = false;
    try {
      hasCompletedTour = localStorage.getItem(storageKey) === 'complete';
    } catch {
      // If persistence is unavailable, showing the guide is safer than hiding it.
    }

    const timer = hasCompletedTour
      ? undefined
      : window.setTimeout(() => {
        if (!startedRef.current) startTour();
      }, 700);

    return () => {
      mountedRef.current = false;
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener(REPLAY_TOUR_EVENT, replay);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [startTour]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(startTour, 0);
    return () => window.clearTimeout(timer);
  }, [open, startTour]);

  return null;
}
