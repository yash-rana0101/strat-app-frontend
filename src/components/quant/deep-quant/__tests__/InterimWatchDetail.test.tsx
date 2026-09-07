// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import InterimWatchDetail from '../InterimWatchDetail';
import type { BestCurrentRead } from '../../../../store/useQuantStore';

describe('InterimWatchDetail (component)', () => {
  it('renders directional read, bias badge, and reference structural levels', () => {
    const mockRead: BestCurrentRead = {
      bias: 'bullish',
      levels: {
        trigger: 1540.5,
        invalidation: 1520.0,
        support: 1510.0,
        resistance: 1550.0,
      },
      why_standing_aside: 'Consolidating above VWAP before breakout trigger level.',
    };

    render(
      <InterimWatchDetail
        symbol="HDFCBANK"
        bestCurrentRead={mockRead}
        sessionStatus="watching"
      />
    );

    // Title and bias badge
    expect(screen.getByText('Active Watch Intelligence')).toBeDefined();
    expect(screen.getByText('BULLISH BIAS')).toBeDefined();

    // Directional read text
    expect(screen.getByText(/HDFCBANK • BULLISH SETUP/)).toBeDefined();

    // Structural reference levels
    expect(screen.getByText('Reference Structural Levels')).toBeDefined();
    expect(screen.getByText('₹1540.50')).toBeDefined();
    expect(screen.getByText('₹1520.00')).toBeDefined();
    expect(screen.getByText('₹1510.00')).toBeDefined();
    expect(screen.getByText('₹1550.00')).toBeDefined();

    // Thesis prose
    expect(screen.getByText(/Consolidating above VWAP before breakout trigger level/)).toBeDefined();
  });

  it('handles empty levels and neutral bias gracefully', () => {
    const mockRead: BestCurrentRead = {
      bias: 'neutral',
      levels: {},
      why_standing_aside: 'Awaiting direction in rangebound market.',
    };

    render(
      <InterimWatchDetail
        symbol="RELIANCE"
        bestCurrentRead={mockRead}
        sessionStatus="watching"
      />
    );

    expect(screen.getByText('NEUTRAL BIAS')).toBeDefined();
    expect(screen.getByText(/RELIANCE • NEUTRAL SETUP/)).toBeDefined();
    expect(screen.getByText(/Awaiting direction in rangebound market/)).toBeDefined();
  });
});

