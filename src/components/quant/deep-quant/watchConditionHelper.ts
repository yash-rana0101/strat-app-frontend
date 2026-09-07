import type { ReasoningStep } from '../../../store/useQuantStore';

export interface WatchConditionData {
  symbol?: string;
  timeframe?: string;
  priceLevel: number | null;
  direction: 'above' | 'below';
  invalidationLevel: number | null;
  volumeMultiplier: number | null;
}

export interface WatchingIndicatorProps {
  symbol?: string;
  priceLevel?: number;
  direction?: 'above' | 'below' | 'up' | 'down' | string;
  invalidationLevel?: number;
  currentPrice?: number;
  timeframe?: string;
  volumeMultiplier?: number;
  heartbeatCount?: number;
  lastHeartbeatAt?: number | null;
  lastHeartbeatStatus?: string | null;
}

export interface WatchBands {
  floorPrice: number | null;
  triggerPrice: number | null;
  ceilingPrice: number | null;
  floorPct: number;
  triggerPct: number;
  ceilingPct: number;
  currentPct: number | null;
  distanceAway: number | null;
  distancePct: string | null;
}

/**
 * Extracts the latest `watch_price_condition` tool arguments or monologue parameters from reasoning steps.
 */
export function extractWatchCondition(steps: ReasoningStep[]): WatchConditionData | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (
      s.toolName === 'watch_price_condition' ||
      (s.type === 'tool_start' && s.toolName === 'watch_price_condition')
    ) {
      const args = s.args as Record<string, unknown> | undefined;
      let priceLevel: number | null = null;
      let invalidationLevel: number | null = null;
      let volumeMultiplier: number | null = null;
      let direction: 'above' | 'below' = 'above';
      let symbol: string | undefined = undefined;
      let timeframe: string | undefined = undefined;

      if (args) {
        if (typeof args.symbol === 'string') symbol = args.symbol;
        if (typeof args.timeframe === 'string') timeframe = args.timeframe;

        const rawLevel = args.price_level ?? args.priceLevel ?? args.level ?? args.target;
        if (typeof rawLevel === 'number') priceLevel = rawLevel;
        else if (rawLevel) priceLevel = parseFloat(String(rawLevel));

        const rawInvalidation =
          args.invalidation_level ?? args.invalidationLevel ?? args.invalidation;
        if (typeof rawInvalidation === 'number') invalidationLevel = rawInvalidation;
        else if (rawInvalidation) invalidationLevel = parseFloat(String(rawInvalidation));

        const rawVol = args.volume_multiplier ?? args.volumeMultiplier ?? args.vol_mult;
        if (typeof rawVol === 'number') volumeMultiplier = rawVol;
        else if (rawVol) volumeMultiplier = parseFloat(String(rawVol));

        const rawDir = String(args.direction ?? args.side ?? 'above').toLowerCase();
        if (
          rawDir.includes('down') ||
          rawDir.includes('below') ||
          rawDir === 'sell' ||
          rawDir === 'short'
        ) {
          direction = 'below';
        }
      }

      // Regex fallback if args was a string or raw payload in content
      if (priceLevel == null && s.content) {
        const pMatch = s.content.match(
          /(?:price_level|level|price|target)[=:\s]+([0-9]+(?:\.[0-9]+)?)/i
        );
        if (pMatch) priceLevel = parseFloat(pMatch[1]);

        const invMatch = s.content.match(
          /(?:invalidation_level|invalidation)[=:\s]+([0-9]+(?:\.[0-9]+)?)/i
        );
        if (invMatch) invalidationLevel = parseFloat(invMatch[1]);

        const dirMatch = s.content.match(/(?:direction|side)[=:\s]+["']?([a-z]+)["']?/i);
        if (
          dirMatch &&
          (dirMatch[1].toLowerCase().includes('below') ||
            dirMatch[1].toLowerCase().includes('down'))
        ) {
          direction = 'below';
        }

        const symMatch = s.content.match(/symbol[=:\s]+["']?([A-Z0-9_\-:]+)["']?/i);
        if (symMatch && !symbol) symbol = symMatch[1];
      }

      if (priceLevel != null || invalidationLevel != null) {
        return {
          symbol,
          timeframe,
          priceLevel: Number.isFinite(priceLevel) ? priceLevel : null,
          direction,
          invalidationLevel: Number.isFinite(invalidationLevel) ? invalidationLevel : null,
          volumeMultiplier: Number.isFinite(volumeMultiplier) ? volumeMultiplier : null,
        };
      }
    }
  }
  return null;
}

/**
 * Computes price bands, percentages, and trigger distance.
 */
export function computeWatchBands(
  direction: 'above' | 'below',
  triggerPrice: number | null,
  invalidationPrice: number | null,
  currentPrice: number | null
): WatchBands {
  let floorPrice: number | null = null;
  let ceilingPrice: number | null = null;

  if (direction === 'above') {
    ceilingPrice = triggerPrice;
    floorPrice =
      invalidationPrice ??
      (currentPrice && triggerPrice && currentPrice < triggerPrice ? currentPrice : null);
  } else {
    floorPrice = triggerPrice;
    ceilingPrice =
      invalidationPrice ??
      (currentPrice && triggerPrice && currentPrice > triggerPrice ? currentPrice : null);
  }

  const validPrices = [floorPrice, triggerPrice, ceilingPrice, currentPrice].filter(
    (v): v is number => v != null && v > 0
  );
  const minP = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxP = validPrices.length > 0 ? Math.max(...validPrices) : 100;
  const range = maxP - minP;

  const calcPct = (p: number | null) => {
    if (p == null || !Number.isFinite(p) || range <= 0) return 50;
    const clamped = Math.max(minP, Math.min(maxP, p));
    return ((clamped - minP) / range) * 100;
  };

  const currentPct = currentPrice ? calcPct(currentPrice) : null;
  const triggerPct = triggerPrice ? calcPct(triggerPrice) : 50;
  const floorPct = floorPrice ? calcPct(floorPrice) : 0;
  const ceilingPct = ceilingPrice ? calcPct(ceilingPrice) : 100;

  const distanceAway = triggerPrice && currentPrice ? triggerPrice - currentPrice : null;
  const distancePct =
    triggerPrice && currentPrice && currentPrice > 0
      ? ((Math.abs(triggerPrice - currentPrice) / currentPrice) * 100).toFixed(2)
      : null;

  return {
    floorPrice,
    triggerPrice,
    ceilingPrice,
    floorPct,
    triggerPct,
    ceilingPct,
    currentPct,
    distanceAway,
    distancePct,
  };
}

/** Formats a timestamp into a human-readable relative time string (e.g. "just now", "45s ago", "2m ago"). */
export function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}
