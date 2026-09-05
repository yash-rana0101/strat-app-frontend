// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import AuthGateScreen from '../AuthGateScreen';

afterEach(cleanup);

describe('AuthGateScreen', () => {
  it('renders verifying session state when status is unknown', () => {
    const { container } = render(<AuthGateScreen status="unknown" />);

    expect(screen.getByRole('status')).toHaveTextContent('Verifying your session…');
    expect(screen.getByAltText('Strat AI')).toBeInTheDocument();
    // Fallback sign-in link is not shown while checking
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    // Uses design tokens for light/dark theme adaptation
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('bg-surface');
  });

  it('renders taking to sign in and fallback link when status is anonymous', () => {
    const { container } = render(<AuthGateScreen status="anonymous" />);

    expect(screen.getByRole('status')).toHaveTextContent('Taking you to sign in…');
    const link = screen.getByRole('link', { name: /continue to sign in/i });
    expect(link).toBeInTheDocument();
    expect(link.className).toContain('bg-card');
    expect(link.className).toContain('border-border-default');
    expect(link.className).toContain('text-text-primary');

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('bg-surface');
  });
});
