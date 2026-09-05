/**
 * Mobile view identifiers for bottom tab navigation.
 *
 * Each value maps to a full-screen view on mobile:
 * - `chart`     — TradingView chart (default)
 * - `watchlist` — Market Watch / Watchlist panel
 * - `agent`     — DeepQuant AI Agent panel
 * - `orderbook` — Order Book / Confluence panel (profile-dependent)
 * - `profile`   — User profile & settings
 */
export type MobileView = 'chart' | 'watchlist' | 'agent' | 'orderbook' | 'profile';

/** Breakpoint (px) below which the mobile layout activates. */
export const MOBILE_BREAKPOINT = 768;

