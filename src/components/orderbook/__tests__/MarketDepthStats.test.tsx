// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import MarketDepthStats from '../MarketDepthStats';
import type { MarketDepthStatsData } from '../marketDepthTypes';

afterEach(cleanup);

const MOCK_STATS: MarketDepthStatsData = {
  open: 2323.2,
  high: 2363.8,
  low: 2300.9,
  close: 2312.0,
  last_price: 2321.9,
  volume: 127590,
  average_price: 2321.9,
  lower_circuit_limit: 2070.85,
  upper_circuit_limit: 2530.95,
  ref_price: 2305.65,
  indicative_close: null,
  total_imbalance: 0,
  last_quantity: 632,
  last_trade_time: '2026-09-04 15:29:47',
};

describe('MarketDepthStats', () => {
  it('renders all Zerodha market depth fields correctly', () => {
    render(<MarketDepthStats stats={MOCK_STATS} symbol="RELIANCE" />);

    // OHLC
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('2,323.20')).toBeInTheDocument();
    expect(screen.getByText('Prev. Close')).toBeInTheDocument();
    expect(screen.getByText('2,312.00')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('2,300.90')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('2,363.80')).toBeInTheDocument();

    // Stats Grid
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('1,27,590')).toBeInTheDocument();

    expect(screen.getByText('Avg. price')).toBeInTheDocument();
    expect(screen.getByText('2,321.90')).toBeInTheDocument();

    expect(screen.getByText('Lower circuit')).toBeInTheDocument();
    expect(screen.getByText('2,070.85')).toBeInTheDocument();

    expect(screen.getByText('Upper circuit')).toBeInTheDocument();
    expect(screen.getByText('2,530.95')).toBeInTheDocument();

    expect(screen.getByText('Ref. price')).toBeInTheDocument();
    expect(screen.getByText('2,305.65')).toBeInTheDocument();

    expect(screen.getByText('Indicative close')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();

    expect(screen.getByText('Total imbalance')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    expect(screen.getByText('LTQ')).toBeInTheDocument();
    expect(screen.getByText('632')).toBeInTheDocument();

    expect(screen.getByText('LTT')).toBeInTheDocument();
    expect(screen.getByText('2026-09-04 15:29:47')).toBeInTheDocument();
  });

  it('handles null/empty stats gracefully without breaking', () => {
    render(<MarketDepthStats stats={null} symbol="RELIANCE" />);

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });
});
