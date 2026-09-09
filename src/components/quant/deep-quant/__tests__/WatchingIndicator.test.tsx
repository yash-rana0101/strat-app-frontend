// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import WatchingIndicator from '../WatchingIndicator';
import {
  computeWatchBands,
  extractWatchCondition,
  formatTimeAgo,
} from '../watchConditionHelper';
import type { ReasoningStep } from '../../../../store/useQuantStore';

describe('extractWatchCondition', () => {
  it('extracts structured watch_price_condition arguments', () => {
    const steps: ReasoningStep[] = [
      {
        id: 's1',
        type: 'tool_start',
        toolName: 'get_candles',
        content: 'fetching candles',
        timestamp: 100,
      },
      {
        id: 's2',
        type: 'tool_start',
        toolName: 'watch_price_condition',
        args: {
          symbol: 'HDFCBANK',
          timeframe: '10m',
          price_level: 1540.5,
          direction: 'above',
          invalidation_level: 1520.0,
          volume_multiplier: 1.5,
        },
        content: '> Executing tool: watch_price_condition...',
        timestamp: 200,
      },
    ];

    const result = extractWatchCondition(steps);
    expect(result).not.toBeNull();
    expect(result?.symbol).toBe('HDFCBANK');
    expect(result?.timeframe).toBe('10m');
    expect(result?.priceLevel).toBe(1540.5);
    expect(result?.direction).toBe('above');
    expect(result?.invalidationLevel).toBe(1520.0);
    expect(result?.volumeMultiplier).toBe(1.5);
  });

  it('detects below / breakdown direction and handles regex fallback', () => {
    const steps: ReasoningStep[] = [
      {
        id: 's1',
        type: 'tool_start',
        toolName: 'watch_price_condition',
        content: 'watch_price_condition(price_level=2450.0, direction="below", invalidation_level=2480.0, symbol="RELIANCE")',
        timestamp: 100,
      },
    ];

    const result = extractWatchCondition(steps);
    expect(result).not.toBeNull();
    expect(result?.priceLevel).toBe(2450.0);
    expect(result?.direction).toBe('below');
    expect(result?.invalidationLevel).toBe(2480.0);
  });

  it('returns null when no watch_price_condition step is present', () => {
    const steps: ReasoningStep[] = [
      {
        id: 's1',
        type: 'tool_start',
        toolName: 'get_candles',
        content: 'fetching candles',
        timestamp: 100,
      },
    ];
    expect(extractWatchCondition(steps)).toBeNull();
  });

  it('reads the replacement watch and ignores the superseded one', () => {
    // The transcript is append-only, so a watch the agent replaced after a
    // heartbeat is still in it. Reading the newest step regardless of the flag
    // showed the level the server had stopped monitoring.
    const steps: ReasoningStep[] = [
      {
        id: 's1',
        type: 'tool_start',
        toolName: 'watch_price_condition',
        args: { symbol: 'RELIANCE', price_level: 2500, direction: 'above' },
        content: 'stale watch',
        timestamp: 100,
        superseded: true,
      },
      {
        id: 's2',
        type: 'tool_start',
        toolName: 'watch_price_condition',
        args: { symbol: 'RELIANCE', price_level: 2465, direction: 'above' },
        content: 'live watch',
        timestamp: 200,
      },
    ];
    expect(extractWatchCondition(steps)?.priceLevel).toBe(2465);
  });

  it('returns null once every watch has been superseded or cancelled', () => {
    // `cancel_price_watch` leaves NOTHING armed. Surfacing the last level anyway
    // would keep the panel claiming to watch a trigger that was deleted.
    const steps: ReasoningStep[] = [
      {
        id: 's1',
        type: 'tool_start',
        toolName: 'watch_price_condition',
        args: { symbol: 'RELIANCE', price_level: 2500, direction: 'above' },
        content: 'cancelled watch',
        timestamp: 100,
        superseded: true,
      },
      {
        id: 's2',
        type: 'tool_start',
        toolName: 'cancel_price_watch',
        content: '> Deleting the previous price trigger...',
        timestamp: 200,
      },
    ];
    expect(extractWatchCondition(steps)).toBeNull();
  });
});

describe('computeWatchBands', () => {
  it('computes correct ceiling, floor, and distance for breakout (above)', () => {
    const bands = computeWatchBands('above', 1540.0, 1520.0, 1532.5);
    expect(bands.ceilingPrice).toBe(1540.0);
    expect(bands.floorPrice).toBe(1520.0);
    expect(bands.triggerPrice).toBe(1540.0);
    expect(bands.distanceAway).toBeCloseTo(7.5, 1);
  });

  it('computes correct ceiling, floor, and distance for breakdown (below)', () => {
    const bands = computeWatchBands('below', 2450.0, 2480.0, 2465.0);
    expect(bands.ceilingPrice).toBe(2480.0);
    expect(bands.floorPrice).toBe(2450.0);
    expect(bands.triggerPrice).toBe(2450.0);
    expect(bands.distanceAway).toBeCloseTo(-15.0, 1);
  });
});

describe('WatchingIndicator (component)', () => {
  it('renders clean minimal container without glowing animations or ping effects', () => {
    const { container } = render(
      <WatchingIndicator
        symbol="HDFCBANK"
        priceLevel={1540.5}
        invalidationLevel={1520.0}
        currentPrice={1532.0}
        direction="above"
      />
    );

    // Header and badges exist
    expect(screen.getByText('AI WATCHER ACTIVE')).toBeDefined();
    expect(screen.getByText('LIVE')).toBeDefined();

    // No glowing / blur / ping animation classes
    expect(container.querySelector('.animate-ping')).toBeNull();
    expect(container.querySelector('.blur-\\[1px\\]')).toBeNull();

    // Real prices rendered
    expect(screen.getAllByText('₹1540.50').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹1520.00')).toBeDefined();
    expect(screen.getByText('₹1532.00')).toBeDefined();

    // Condition text rendered
    expect(screen.getByText(/Price ≥ ₹1540.50/)).toBeDefined();
  });

  it('renders heartbeat pulse count, relative time, and status message', () => {
    render(
      <WatchingIndicator
        symbol="HDFCBANK"
        priceLevel={1540.5}
        invalidationLevel={1520.0}
        currentPrice={1532.0}
        direction="above"
        heartbeatCount={3}
        lastHeartbeatAt={Date.now() - 45000}
        lastHeartbeatStatus="Setup holding: bullish"
      />
    );

    expect(screen.getByText('Heartbeat:')).toBeDefined();
    expect(screen.getByText(/Pulse #3/)).toBeDefined();
    expect(screen.getByText(/45s ago/)).toBeDefined();
    expect(screen.getByText('Setup holding: bullish')).toBeDefined();
  });

  it('renders initial heartbeat active status when heartbeatCount is 0', () => {
    render(
      <WatchingIndicator
        symbol="RELIANCE"
        priceLevel={2450.0}
        direction="above"
        heartbeatCount={0}
      />
    );

    expect(screen.getByText('Heartbeat:')).toBeDefined();
    expect(screen.getByText(/Active • Background monitor engaged/)).toBeDefined();
  });
});

describe('formatTimeAgo', () => {
  it('formats empty, recent, and past timestamps properly', () => {
    expect(formatTimeAgo(null)).toBe('');
    expect(formatTimeAgo(Date.now() - 3000)).toBe('just now');
    expect(formatTimeAgo(Date.now() - 25000)).toBe('25s ago');
    expect(formatTimeAgo(Date.now() - 125000)).toBe('2m ago');
  });
});

