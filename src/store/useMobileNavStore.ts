'use client';

import { create } from 'zustand';
import type { MobileView } from '../types/mobile';

interface MobileNavState {
  /** Currently active full-screen view on mobile viewports. */
  activeView: MobileView;
  setActiveView: (view: MobileView) => void;

  /** Whether the universal Symbol Search modal is open. */
  isSearchOpen: boolean;
  searchInitialQuery: string;
  openSearch: (initialQuery?: string) => void;
  closeSearch: () => void;
}

/**
 * Mobile navigation and search dialog state store.
 * Manages active bottom tab and mobile modal triggers.
 */
export const useMobileNavStore = create<MobileNavState>((set) => ({
  activeView: 'chart',
  setActiveView: (view) => set({ activeView: view }),

  isSearchOpen: false,
  searchInitialQuery: '',
  openSearch: (initialQuery = '') =>
    set({ isSearchOpen: true, searchInitialQuery: initialQuery }),
  closeSearch: () =>
    set({ isSearchOpen: false, searchInitialQuery: '' }),
}));

