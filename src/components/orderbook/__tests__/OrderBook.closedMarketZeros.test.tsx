// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../../../lib/kiteFetch', () => ({
  kiteFetch: vi.fn(() => new Promise(() => {})),
}));
vi.mock('../../../lib/bridge', () => ({
  bridgeListen: vi.fn(async () => () => {}),
}));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  motion: { div: (p: Record<string, unknown>) => <div {...p} /> },
}));

import OrderBook from '../../OrderBook';
import { useTradeStore } from '../../../store/useTradeStore';
import { BOOK_CACHE_VERSION } from '../orderBookHelpers';

describe('OrderBook — Zerodha-style 5-depth with 0s when market closed / stopped', () => {
  beforeEach(() => {
    useTradeStore.setState({ selectedSymbol: 'RELIANCE' });
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('never displays "Awaiting Market Depth Data..." blank space when order book has no orders', () => {
    const { queryByText } = render(<OrderBook />);
    expect(queryByText('Awaiting Market Depth Data...')).toBeNull();
    expect(queryByText('Order book populates when live depth feed connects')).toBeNull();
  });

  it('renders 5 ask levels and 5 bid levels of 0.00 / 0 / 0 when market is closed / empty', () => {
    const { container } = render(<OrderBook />);

    // Find the two ladders: ask ladder and bid ladder
    const ladders = Array.from(container.querySelectorAll<HTMLElement>('div.overflow-y-auto')).filter(
      (el) => el.className.includes('flex-col')
    );
    expect(ladders).toHaveLength(2);
    const [asksContainer, bidsContainer] = ladders;

    // Check ask rows (should have 5 rows with 0.00)
    const askRows = asksContainer.querySelectorAll('.grid-cols-3');
    expect(askRows).toHaveLength(5);
    askRows.forEach((row) => {
      expect(row.textContent).toContain('0.00');
    });

    // Check bid rows (should have 5 rows with 0.00)
    const bidRows = bidsContainer.querySelectorAll('.grid-cols-3');
    expect(bidRows).toHaveLength(5);
    bidRows.forEach((row) => {
      expect(row.textContent).toContain('0.00');
    });
  });

  it('renders real levels alongside padded zero levels when one side is partial (e.g. 1 bid, 0 asks)', () => {
    // Seed 1 bid and 0 asks (the user\'s reported screenshot scenario)
    const partialBook = {
      asks: [],
      bids: [{ price: 712.1, size: 28202, total: 28202 }],
      spread: 0,
      spreadPct: '0.000',
      midPrice: 0,
    };
    localStorage.setItem(
      `ai-trader-orderbook-${BOOK_CACHE_VERSION}-RELIANCE`,
      JSON.stringify(partialBook)
    );

    const { container, queryByText } = render(<OrderBook />);

    // Must NOT show awaiting placeholder
    expect(queryByText('Awaiting Market Depth Data...')).toBeNull();

    const ladders = Array.from(container.querySelectorAll<HTMLElement>('div.overflow-y-auto')).filter(
      (el) => el.className.includes('flex-col')
    );
    expect(ladders).toHaveLength(2);
    const [asksContainer, bidsContainer] = ladders;

    // 5 ask rows, all 0.00
    const askRows = asksContainer.querySelectorAll('.grid-cols-3');
    expect(askRows).toHaveLength(5);

    // 5 bid rows: first row has 712.10 and 28,202, remaining 4 rows are 0.00
    const bidRows = bidsContainer.querySelectorAll('.grid-cols-3');
    expect(bidRows).toHaveLength(5);
    expect(bidRows[0].textContent).toContain('712.10');
    expect(bidRows[0].textContent).toContain('28,202');

    // Remaining rows pad with 0.00
    expect(bidRows[1].textContent).toContain('0.00');
    expect(bidRows[4].textContent).toContain('0.00');
  });

  it('renders mid pill with LTP fallback when spread is 0', () => {
    const partialBook = {
      asks: [],
      bids: [{ price: 712.1, size: 28202, total: 28202 }],
      spread: 0,
      spreadPct: '0.000',
      midPrice: 0,
    };
    localStorage.setItem(
      `ai-trader-orderbook-${BOOK_CACHE_VERSION}-RELIANCE`,
      JSON.stringify(partialBook)
    );
    localStorage.setItem(
      'ai-trader-orderbook-stats-RELIANCE',
      JSON.stringify({ last_price: 712.1 })
    );

    const { getAllByText, getByText } = render(<OrderBook />);
    expect(getAllByText('712.10').length).toBeGreaterThanOrEqual(2);
    expect(getByText('LTP')).toBeInTheDocument();
  });
});
