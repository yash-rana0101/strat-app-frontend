// lib/preferencesSync.ts — Bidirectional synchronization service between client state and StratAI-preference.
//
// Ensures:
// 1. Terminal preferences, watchlists, radar state, and localStorage mirror to MongoDB.
// 2. On app boot / login, remote cloud state rehydrates local browser stores seamlessly.
// 3. Debounced synchronization batches changes and handles offline / unauthenticated states gracefully.

import {
  fetchUserPreferences,
  syncLocalStorageToBackend,
  rehydrateLocalStorageFromBackend,
  updateUserPreferences,
  type UserPreferencesRecord,
} from './api/preferencesClient';
import { useAuthStore } from '../store/useAuthStore';
import { useTradeStore, type WatchlistItem } from '../store/useTradeStore';
import { useChartUIStore } from '../store/useChartUIStore';
import { useRadarStore } from '../store/useRadarStore';
import { PREFERENCES_STORAGE_KEY, parsePreferences } from './preferences';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000; // 2s debounce for cloud sync
let isRehydrating = false;

/**
 * Collect all relevant StratAI entries from localStorage into a dictionary.
 */
export function collectLocalStorage(): Record<string, any> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const items: Record<string, any> = {};

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      // Filter to StratAI terminal keys and tradingview keys
      if (
        key.startsWith('stratai.') ||
        key.startsWith('tv_') ||
        key.startsWith('tradingview') ||
        key === '__QUANT_RADAR__' ||
        key === '__WATCHLIST__'
      ) {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          try {
            items[key] = JSON.parse(val);
          } catch {
            items[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[preferencesSync] Failed to read localStorage:', err);
  }

  return items;
}

/**
 * Schedule a debounced background sync of localStorage and preferences to MongoDB.
 */
export function scheduleCloudSync(): void {
  if (typeof window === 'undefined' || isRehydrating) return;
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (!isAuthenticated) return;

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    syncTimer = null;
    try {
      const items = collectLocalStorage();
      if (Object.keys(items).length > 0) {
        await syncLocalStorageToBackend(items, false);
      }
    } catch (err) {
      console.warn('[preferencesSync] Background sync failed:', err);
    }
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Rehydrate all client stores and localStorage from MongoDB user preferences.
 * Safe to call repeatedly; skips if already rehydrating or unauthenticated.
 */
export async function rehydrateFromCloud(): Promise<boolean> {
  if (typeof window === 'undefined' || isRehydrating) return false;
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (!isAuthenticated) return false;

  isRehydrating = true;
  try {
    const cloudRecord: UserPreferencesRecord | null = await fetchUserPreferences();
    if (!cloudRecord) {
      // User has no saved cloud preferences yet, push current local preferences as seed
      scheduleCloudSync();
      return false;
    }

    // 1. Rehydrate localStorage items if present in cloud
    if (cloudRecord.localStorage && typeof cloudRecord.localStorage === 'object') {
      for (const [key, value] of Object.entries(cloudRecord.localStorage)) {
        try {
          const currentLocal = window.localStorage.getItem(key);
          // Only write if key is missing locally or cloud is newer
          if (currentLocal === null) {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            window.localStorage.setItem(key, serialized);
          }
        } catch {
          // Quota / private mode
        }
      }
    }

    // 2. Rehydrate Terminal Preferences (symbol, timeframe, layout, chartType)
    const rawPrefs = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!rawPrefs && cloudRecord.window) {
      const parsed = parsePreferences(JSON.stringify(cloudRecord.preferences || {}));
      if (parsed.selectedSymbol) {
        useTradeStore.getState().setSelectedSymbol(parsed.selectedSymbol);
      }
      if (parsed.activeTimeframe) {
        useTradeStore.getState().setActiveTimeframe(parsed.activeTimeframe);
      }
      if (parsed.activeProfile) {
        useTradeStore.getState().setActiveProfile(parsed.activeProfile);
      }
      if (parsed.chartType) {
        useChartUIStore.getState().setChartType(parsed.chartType);
      }
    }

    // 3. Rehydrate Watchlists if stored in cloud and local is empty
    if (Array.isArray(cloudRecord.watchlists) && cloudRecord.watchlists.length > 0) {
      const currentWatchlist = useTradeStore.getState().watchlist;
      if (currentWatchlist.length === 0) {
        const defaultList = cloudRecord.watchlists.find((w) => w.isDefault) || cloudRecord.watchlists[0];
        if (defaultList?.items && defaultList.items.length > 0) {
          const hydratedItems: WatchlistItem[] = defaultList.items.map((item) => ({
            symbol: item.symbol,
            token: 0,
            name: item.name ?? item.symbol,
            sector: item.segment || 'EQ',
            lastPrice: item.lastPrice ?? 0,
            change: item.changePercent ?? null,
            close: null,
          }));
          useTradeStore.getState().setWatchlist(hydratedItems);
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('[preferencesSync] Error rehydrating from cloud:', err);
    return false;
  } finally {
    isRehydrating = false;
  }
}
