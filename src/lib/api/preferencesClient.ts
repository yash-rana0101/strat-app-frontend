// lib/api/preferencesClient.ts — Client API for StratAI-preference microservice.
//
// Communicates with same-origin /api/preferences/* endpoints (proxied to MongoDB + Prisma).

export interface PanelLayoutPreferences {
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  leftPanelCollapsed?: boolean;
  rightPanelCollapsed?: boolean;
  activeLeftTab?: 'watchlist' | 'sentiment' | 'consensus' | 'patterns' | string;
  activeRightTab?: 'trade' | 'chat' | 'telemetry' | string;
}

export interface WindowSettingsPreferences {
  selectedSymbol?: string;
  timeframe?: string;
  chartType?: 'candlestick' | 'bar' | 'line' | 'area' | 'heikin-ashi' | string;
  chartTheme?: 'dark' | 'light' | string;
  chartLayout?: 'single' | 'split-horizontal' | 'split-vertical' | 'grid-4' | string;
  indicators?: any;
  drawings?: any;
  chartSettings?: any;
}

export interface WatchlistItemDTO {
  symbol: string;
  name?: string | null;
  segment?: string | null;
  exchange?: string;
  lastPrice?: number | null;
  changePercent?: number | null;
  orderIndex?: number;
  tags?: string[];
}

export interface WatchlistDTO {
  id?: string;
  name: string;
  isDefault?: boolean;
  sortOrder?: number;
  items?: WatchlistItemDTO[];
}

export interface QuantRadarStateDTO {
  sentimentState?: any;
  consensusState?: any;
  patternState?: any;
  pipelineTelemetry?: any;
  activeFilters?: any;
  alertRules?: any;
}

export interface TradingSessionDTO {
  id?: string;
  userId?: string;
  sessionKey: string;
  title: string;
  symbol: string;
  timeframe: string;
  isActive?: boolean;
  orderIndex?: number;
  status?: 'ACTIVE' | 'ARCHIVED' | 'CLOSED' | string;
  chartState?: any;
  analysisState?: any;
  messages?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TradePlanDTO {
  id?: string;
  userId?: string;
  sessionId?: string | null;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT' | string;
  setupType: string;
  conviction: 'LOW' | 'MODERATE' | 'HIGH' | string;
  convictionScore?: number;
  status?: 'DRAFT' | 'COMMITTED' | 'EXECUTED' | 'CANCELLED' | string;
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  riskRewardRatio?: string | null;
  riskAmount?: number | null;
  riskPercent?: number | null;
  catalysts?: any;
  executionSteps?: any;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TradeResultDTO {
  id?: string;
  userId?: string;
  tradePlanId?: string | null;
  sessionId?: string | null;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT' | string;
  entryPrice: number;
  exitPrice: number;
  quantity?: number;
  pnl: number;
  pnlPercent: number;
  status?: 'WIN' | 'LOSS' | 'BREAKEVEN' | string;
  exitReason?: 'TARGET_HIT' | 'STOP_LOSS_HIT' | 'MANUAL_EXIT' | 'TRAILING_SL' | 'TIMED_OUT' | string;
  entryTime?: string | Date;
  exitTime?: string | Date;
  durationMinutes?: number | null;
  riskRewardAchieved?: number | null;
  executionDetails?: any;
  metrics?: any;
  rawData?: any; // Raw broker webhook payload, order execution fills, AI reasoning transcript
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TradeResultsSummaryDTO {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  profitFactor?: number;
}

export interface UserPreferencesRecord {
  userId: string;
  layout: PanelLayoutPreferences;
  window: WindowSettingsPreferences;
  watchlists: WatchlistDTO[];
  quantRadar?: QuantRadarStateDTO | null;
  localStorage?: Record<string, any> | null;
  preferences: Record<string, any>;
  version: number;
  createdAt: number;
  updatedAt: number;
  isNew?: boolean;
}

const BASE_URL = '/api/preferences';

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 404) {
        return null;
      }
      const errText = await res.text().catch(() => '');
      console.warn(`[preferencesClient] ${options.method || 'GET'} ${url} returned ${res.status}:`, errText);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[preferencesClient] Network error for ${url}:`, err);
    return null;
  }
}

// ── Unified Preferences ─────────────────────────────────────────────────────

export async function fetchUserPreferences(): Promise<UserPreferencesRecord | null> {
  return request<UserPreferencesRecord>('');
}

export async function updateUserPreferences(patch: Record<string, any>): Promise<UserPreferencesRecord | null> {
  return request<UserPreferencesRecord>('', {
    method: 'PATCH',
    body: JSON.stringify({ patch }),
  });
}

export async function replaceUserPreferences(preferences: Record<string, any>): Promise<UserPreferencesRecord | null> {
  return request<UserPreferencesRecord>('', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  });
}

export async function deleteUserPreferences(): Promise<boolean> {
  const res = await request<{ deleted: boolean }>('', { method: 'DELETE' });
  return !!res?.deleted;
}

// ── Panel Layout & Window ───────────────────────────────────────────────────

export async function fetchLayoutPreferences(): Promise<PanelLayoutPreferences | null> {
  return request<PanelLayoutPreferences>('/layout');
}

export async function updateLayoutPreferences(
  layout: Partial<PanelLayoutPreferences>
): Promise<PanelLayoutPreferences | null> {
  return request<PanelLayoutPreferences>('/layout', {
    method: 'PATCH',
    body: JSON.stringify(layout),
  });
}

export async function fetchWindowPreferences(): Promise<WindowSettingsPreferences | null> {
  return request<WindowSettingsPreferences>('/window');
}

export async function updateWindowPreferences(
  windowSettings: Partial<WindowSettingsPreferences>
): Promise<WindowSettingsPreferences | null> {
  return request<WindowSettingsPreferences>('/window', {
    method: 'PATCH',
    body: JSON.stringify(windowSettings),
  });
}

// ── Watchlists ──────────────────────────────────────────────────────────────

export async function fetchWatchlists(): Promise<WatchlistDTO[]> {
  const res = await request<{ watchlists: WatchlistDTO[] }>('/watchlists');
  return res?.watchlists || [];
}

export async function saveWatchlist(watchlist: WatchlistDTO): Promise<WatchlistDTO[] | null> {
  const res = await request<{ watchlists: WatchlistDTO[] }>('/watchlists', {
    method: 'POST',
    body: JSON.stringify(watchlist),
  });
  return res?.watchlists || null;
}

export async function deleteWatchlist(watchlistId: string): Promise<WatchlistDTO[] | null> {
  const res = await request<{ watchlists: WatchlistDTO[] }>(`/watchlists/${encodeURIComponent(watchlistId)}`, {
    method: 'DELETE',
  });
  return res?.watchlists || null;
}

// ── Multi-Session Tabs ──────────────────────────────────────────────────────

export async function fetchSessions(status?: string): Promise<TradingSessionDTO[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await request<{ sessions: TradingSessionDTO[] }>(`/sessions${query}`);
  return res?.sessions || [];
}

export async function saveSession(session: TradingSessionDTO): Promise<TradingSessionDTO | null> {
  const res = await request<{ session: TradingSessionDTO }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
  return res?.session || null;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const res = await request<{ deleted: boolean }>(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
  return !!res?.deleted;
}

// ── Trade Plans & Results ───────────────────────────────────────────────────

export async function fetchTradePlans(status?: string): Promise<TradePlanDTO[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await request<{ tradePlans: TradePlanDTO[] }>(`/trades${query}`);
  return res?.tradePlans || [];
}

export async function saveTradePlan(plan: TradePlanDTO): Promise<TradePlanDTO | null> {
  const res = await request<{ tradePlan: TradePlanDTO }>('/trades', {
    method: 'POST',
    body: JSON.stringify(plan),
  });
  return res?.tradePlan || null;
}

export async function deleteTradePlan(tradePlanId: string): Promise<boolean> {
  const res = await request<{ deleted: boolean }>(`/trades/${encodeURIComponent(tradePlanId)}`, {
    method: 'DELETE',
  });
  return !!res?.deleted;
}

export interface TradeResultFilters {
  symbol?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

export async function fetchTradeResults(filters: TradeResultFilters = {}): Promise<TradeResultDTO[]> {
  const params = new URLSearchParams();
  if (filters.symbol) params.set('symbol', filters.symbol);
  if (filters.status) params.set('status', filters.status);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.skip) params.set('skip', String(filters.skip));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await request<{ results: TradeResultDTO[] }>(`/trade-results${query}`);
  return res?.results || [];
}

export async function fetchTradeResultsSummary(): Promise<TradeResultsSummaryDTO | null> {
  const res = await request<{ summary: TradeResultsSummaryDTO }>('/trade-results/summary');
  return res?.summary || null;
}

export async function saveTradeResult(result: TradeResultDTO): Promise<TradeResultDTO | null> {
  const res = await request<{ result: TradeResultDTO }>('/trade-results', {
    method: 'POST',
    body: JSON.stringify(result),
  });
  return res?.result || null;
}

export async function deleteTradeResult(tradeResultId: string): Promise<boolean> {
  const res = await request<{ deleted: boolean }>(`/trade-results/${encodeURIComponent(tradeResultId)}`, {
    method: 'DELETE',
  });
  return !!res?.deleted;
}

// ── Quant Radar ─────────────────────────────────────────────────────────────

export async function fetchQuantRadarState(): Promise<QuantRadarStateDTO | null> {
  const res = await request<{ quantRadar: QuantRadarStateDTO }>('/quant-radar');
  return res?.quantRadar || null;
}

export async function updateQuantRadarState(patch: Partial<QuantRadarStateDTO>): Promise<QuantRadarStateDTO | null> {
  const res = await request<{ quantRadar: QuantRadarStateDTO }>('/quant-radar', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res?.quantRadar || null;
}

// ── LocalStorage Mirror & Sync ──────────────────────────────────────────────

export async function syncLocalStorageToBackend(
  items: Record<string, any>,
  replace: boolean = false
): Promise<boolean> {
  const res = await request<{ synced: boolean }>('/localstorage/sync', {
    method: 'POST',
    body: JSON.stringify({ items, replace }),
  });
  return !!res?.synced;
}

export async function rehydrateLocalStorageFromBackend(): Promise<Record<string, any> | null> {
  const res = await request<{ localStorage: Record<string, any> }>('/localstorage');
  return res?.localStorage || null;
}

export async function checkPreferenceHealth(): Promise<{ status: string; database?: string } | null> {
  return request<{ status: string; database?: string }>('/health');
}
