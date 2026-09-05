'use client';

import { useSyncExternalStore } from 'react';
import { MOBILE_BREAKPOINT } from '../types/mobile';

// ── Singleton media-query listener ────────────────────────────────────
// A single `matchMedia` instance shared by every component that calls
// `useIsMobile()`. The external-store pattern avoids duplicate listeners
// and plays nicely with React 18 concurrent rendering.

const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

let mql: MediaQueryList | null = null;

function getMql(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  if (!mql) mql = window.matchMedia(query);
  return mql;
}

function subscribe(cb: () => void): () => void {
  const m = getMql();
  if (!m) return () => { };
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}

function getSnapshot(): boolean {
  const m = getMql();
  return m ? m.matches : false;
}

/** SSR fallback — assume desktop during server rendering. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns `true` when the viewport is narrower than `MOBILE_BREAKPOINT` (768 px).
 *
 * SSR-safe & test-safe: returns `false` on the server or in headless testing
 * environments without matchMedia, preventing hydration mismatches and test crashes.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

