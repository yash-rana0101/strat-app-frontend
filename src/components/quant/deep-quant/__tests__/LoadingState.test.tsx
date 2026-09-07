// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('renders a spinner and default analyzing message', () => {
    const { container } = render(<LoadingState />);
    expect(screen.getByText('Analyzing market data…')).toBeDefined();
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('renders custom message when provided', () => {
    render(<LoadingState message="Scanning breakout setups…" />);
    expect(screen.getByText('Scanning breakout setups…')).toBeDefined();
  });

  it('renders agentStatus when not default placeholder', () => {
    render(<LoadingState agentStatus="Evaluating liquidity levels" />);
    expect(screen.getByText('Evaluating liquidity levels')).toBeDefined();
  });
});
