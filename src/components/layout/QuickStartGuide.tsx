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

const step = (
  element: string | undefined,
  title: string,
  description: string,
  side: 'top' | 'right' | 'bottom' | 'left' = 'right'
): DriveStep => ({
  element,
  popover: { title, description, side, align: 'center' },
});

function desktopSteps(): DriveStep[] {
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
    step(
      '[data-tour="ai-agent"]',
      'Deep Quant AI Agent',
      'Find a Trade Setup scans the active symbol; Verify My Setup evaluates your own thesis. Runs stream their reasoning, can watch price conditions, and accept follow-up Q&A when available. Plan access and credits may apply.',
      'left'
    ),
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

function mobileSteps(): DriveStep[] {
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
    step(
      '[data-tour="mobile-agent"]',
      'AI Agent',
      'Find a new setup or verify your own thesis, follow streamed analysis, monitor price-watcher conditions, and ask follow-up questions when available.',
      'top'
    ),
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
  return steps.filter(({ element }) => {
    if (typeof element !== 'string') return true;
    const target = document.querySelector(element);
    if (target === null) return false;
    const bounds = target.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0;
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
    const steps = availableSteps(isDesktop ? desktopSteps() : mobileSteps());
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
