import { useEffect, useRef, useState } from 'react';
import { useTradeStore } from '../store/useTradeStore';
import { useChartUIStore } from '../store/useChartUIStore';
import { useFeature } from '../store/useFeatureStore';
import { whenChartReady } from '../charting/widgetReady';
import { computeGhostProjection, clampProjectionBars } from './ghostLineComputation';
import { debugLog } from '../lib/debugLog';

/**
 * Minimum gap between intra-bar ghost-line redraws.
 *
 * A redraw costs one IPC round-trip into the chart iframe per segment (up to ~20
 * for a curved projection), so an unthrottled tick feed would queue draws faster
 * than they complete — the redraw storm. This was 4000ms, which was far enough
 * apart that the line visibly lagged the price and read as static rather than
 * live. 1500ms tracks the market while still collapsing tick bursts into one draw.
 */
const PULSE_THROTTLE_MS = 1500;

/**
 * How many consecutive rejected projections before the line is cleared.
 *
 * A rejection means the bounds guard threw out one candidate — usually a single
 * volatile tick — so the previous line is still the best information available
 * and blanking the chart for it is the "line disappears" bug. But if every
 * candidate is being rejected, the displayed line is stale and increasingly
 * wrong, so it must eventually go. Three at the ~1.5s pulse cadence is a few
 * seconds of grace.
 */
const MAX_CONSECUTIVE_REJECTS = 3;

/** Skip redraw when every point matches the last drawn set within this epsilon.
 *
 *  Sized to the price tick, not to a fixed number. NSE quotes to one paisa
 *  (`pricescale: 100` in the datafeed's `LibrarySymbolInfo`), so half a paisa is
 *  the largest change that cannot represent a real move at ANY price — and it
 *  is what we treat as "no change".
 *
 *  The previous absolute 1e-4 was 4e-9 relative on a ₹25 000 index: no live tick
 *  is ever that small, so the guard never fired there and every pulse paid a
 *  full redraw into the chart iframe. A purely RELATIVE epsilon has the opposite
 *  failure — 1e-6 of ₹25 000 is 2.5 paisa, which silently swallows real moves.
 *  An absolute half-paisa floor is correct at both ends: it is coarse enough to
 *  absorb float noise on an index and fine enough to keep every genuine tick on
 *  a ₹40 option. */
const POINTS_EPS_PRICE = 0.005;
const POINTS_EPS_TIME = 0.5;

export function pointsUnchanged(
  a: { time: number; price: number }[],
  b: { time: number; price: number }[]
): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i].time - b[i].time) > POINTS_EPS_TIME) return false;
    if (Math.abs(a[i].price - b[i].price) >= POINTS_EPS_PRICE) return false;
  }
  return true;
}

// ── Drawing helpers ──────────────────────────────────────────────────────

/**
 * Remove the given ghost entities from the chart.
 *
 * Returns the ids that FAILED to remove so the caller can keep tracking them
 * and retry on the next pass. Previously failures were swallowed silently,
 * which orphaned whole segment-sets on the chart — every subsequent redraw
 * then stacked a fresh projection on top, producing the ladder/fan of dashed
 * lines. Keeping the un-removed ids tracked makes clearing self-healing.
 *
 * Note: a returned "failed" id is NOT retried forever. The caller bounds
 * retries via `pruneFailedIds` (see below) so that ids which are permanently
 * invalid — e.g. ids that belonged to a previous widget that was torn down
 * and recreated — are dropped after a few consecutive failures instead of
 * accumulating in the ref and spamming warnings on every redraw.
 */
function removeGhostSegments(chart: any, entityIds: string[]): string[] {
  const failed: string[] = [];
  for (const id of entityIds) {
    try {
      chart.removeEntity(id);
    } catch (err) {
      // Not necessarily fatal (the entity may already be gone), but do NOT
      // silently drop it — keep it so the next clear retries.
      console.warn('[GhostLine] removeEntity failed, will retry:', id, err);
      failed.push(id);
    }
  }
  return failed;
}

/**
 * Pure helper: decide which failed-to-remove ids are still worth retrying and
 * update the per-id attempt counter accordingly.
 *
 * Background: `removeEntity` can throw transiently (e.g. a shape still being
 * committed). Retrying on the next redraw self-heals those. But after a widget
 * teardown/recreate, ids from the dead widget are permanently invalid on the
 * new chart, so `removeEntity` throws on EVERY pass. Without bounding, those
 * dead ids live in the renderer's id list forever, warn on every redraw, and
 * can transiently let a new run clear a prior run's still-valid segments via
 * the shared ref. We therefore drop an id after `maxAttempts` consecutive
 * failures.
 *
 * Contract:
 *   - `failed`    — ids returned by `removeGhostSegments` this pass (each is
 *                   one more consecutive failure for that id).
 *   - `attempts`  — running per-id consecutive-failure counts. MUTATED in
 *                   place: incremented for every `failed` id, and entries are
 *                   deleted for ids that are dropped or that are not failed
 *                   this pass (a successful remove resets the counter).
 *   - `allTracked`— the full set of ids currently tracked in the ref, so we
 *                   can reset the attempt counter for ids that were NOT in
 *                   `failed` (i.e. they removed successfully this pass). May be
 *                   omitted when the caller handles resets itself.
 *   - returns     — the subset of `failed` still worth retrying (attempt count
 *                   < maxAttempts). An id that has failed `maxAttempts`
 *                   consecutive times is dropped from `attempts` and NOT
 *                   returned.
 */
export function pruneFailedIds(
  failed: string[],
  attempts: Map<string, number>,
  maxAttempts = 2,
  allTracked?: string[]
): string[] {
  // A successful remove resets (clears) that id's consecutive-failure counter.
  // Any tracked id not present in `failed` this pass removed cleanly.
  const failedSet = new Set(failed);
  if (allTracked) {
    for (const id of allTracked) {
      if (!failedSet.has(id)) attempts.delete(id);
    }
  } else {
    // Without the full tracked set we still drop counters for ids we know are
    // no longer failing (keeps the map from growing across healthy runs).
    for (const id of [...attempts.keys()]) {
      if (!failedSet.has(id)) attempts.delete(id);
    }
  }

  const retry: string[] = [];
  for (const id of failed) {
    const next = (attempts.get(id) ?? 0) + 1;
    if (next >= maxAttempts) {
      // Permanently invalid (e.g. belongs to a torn-down widget). The id has
      // now failed `maxAttempts` consecutive times — stop tracking it so the
      // ref can't accumulate dead ids forever. (An id that fails once is
      // retained for one retry; an id that fails maxAttempts times is dropped.)
      attempts.delete(id);
      console.warn(`[GhostLine] dropping id after ${maxAttempts} consecutive remove failures:`, id);
      continue;
    }
    attempts.set(id, next);
    retry.push(id);
  }
  return retry;
}

/**
 * Pure, unit-testable decision: should a `onVisibleRangeChanged` event re-fire
 * the zoom pulse?
 *
 * TradingView auto-scrolls the right edge forward as live bars arrive, which
 * ALSO fires `onVisibleRangeChanged`. A new bar already bumps `lastBarTime`
 * (a redraw dep), so if we re-project on every range change we get 2–3
 * concurrent redraws per new bar — the source of the "ghost line thrash".
 *
 * We therefore pulse ONLY on genuine user zoom, NOT on programmatic
 * auto-scroll. TradingView's auto-scroll keeps the visible window's WIDTH
 * constant and just slides both edges forward by one bar as new bars arrive,
 * so the signature of "no user zoom" is: the range WIDTH (`to - from`) is
 * unchanged:
 *   · WIDTH (`to - from`) changed → user ZOOMED → pulse.
 *   · width unchanged → auto-scroll / no-op → do NOT pulse (`lastBarTime`
 *     already covers the new bar; a width-preserving move doesn't change the
 *     projection length anyway).
 * The first event (no `prev`) always pulses so we bootstrap on first range.
 *
 * Kept pure (no React, no widget) so it can be unit-tested directly.
 */
export function shouldPulseOnRangeChange(
  prev: { from: number; to: number } | null,
  next: { from: number; to: number }
): boolean {
  // First event — establish a baseline; pulse so the projection length tracks
  // the initial visible range.
  if (prev === null) return true;
  // User zoomed (range width changed) → re-project. A constant-width move is
  // either programmatic auto-scroll (new bar) or a width-preserving pan —
  // neither changes the projection length, so we skip both.
  return next.to - next.from !== prev.to - prev.from;
}

/**
 * Fallback: draw the ghost line as connected `trend_line` segments.
 *
 * Kept only as the last resort of `drawGhostEntity`. An earlier TradingView
 * build auto-closed `polyline` into a triangle and collapsed `path` to a stub,
 * so per-bar segments were the only reliable rendering; the vendored v32.1
 * bundle draws both correctly (verified 2m/10m/75m/1W), and a single entity is
 * one IPC round-trip instead of ~20 with dash patterns restarting at every
 * vertex.
 *
 * `shouldAbort` is polled between each segment. If a newer draw supersedes this
 * one mid-flight we stop immediately and remove whatever we already drew, so a
 * stale run can never leave half a line behind (a source of the stacked-line
 * artefact).
 */
async function drawGhostSegments(
  chart: any,
  points: { time: number; price: number }[],
  singleSegment: boolean,
  shouldAbort: () => boolean
): Promise<string[]> {
  const entityIds: string[] = [];

  // Keep strictly-increasing, de-duplicated points (guards against a session
  // boundary producing two points at the same timestamp).
  const clean: { time: number; price: number }[] = [];
  for (const p of points) {
    if (clean.length === 0 || p.time > clean[clean.length - 1].time) clean.push(p);
  }

  debugLog(
    '[GhostLine] DRAW',
    clean.length,
    'pts times=',
    clean.map((p) => p.time).join(','),
    'prices=',
    clean.map((p) => p.price).join(',')
  );
  if (clean.length < 2) return entityIds;

  // A straight line is ONE segment (anchor → end): a single entity that can't
  // fragment or ladder. A curved line is the consecutive point pairs.
  const pairs: [{ time: number; price: number }, { time: number; price: number }][] = singleSegment
    ? [[clean[0], clean[clean.length - 1]]]
    : clean.slice(0, -1).map((p, i) => [p, clean[i + 1]]);

  for (let i = 0; i < pairs.length; i++) {
    // Superseded mid-draw → undo what we've drawn and bail. This is what stops
    // a stale, slower run from leaving orphaned segments on the chart.
    if (shouldAbort()) {
      removeGhostSegments(chart, entityIds);
      return [];
    }
    try {
      const entityId = await chart.createMultipointShape(
        [
          { time: pairs[i][0].time, price: pairs[i][0].price },
          { time: pairs[i][1].time, price: pairs[i][1].price },
        ],
        {
          shape: 'trend_line',
          lock: true,
          disableSelection: true,
          disableSave: true,
          disableUndo: true,
          overrides: {
            linecolor: '#f59e0b',
            linewidth: 2,
            // SOLID, not dashed — and this is load-bearing for a curved line.
            //
            // A curved projection is drawn as up to 20 joined 2-point segments
            // (see the note above for why polyline/path can't be used here).
            // Each segment is its own entity, so a dash pattern RESTARTS at every
            // vertex: instead of one continuous dashed curve you get 20 short
            // independent dash runs, which reads as a broken ladder rather than a
            // line. Solid strokes join seamlessly at shared endpoints, so the
            // segments render as one smooth continuous curve. The projection's
            // "ghost" identity comes from its amber colour, not the dashes.
            //
            // The single-entity paths in `drawGhostEntity` are solid for a
            // related reason (a dash period wider than the bar spacing erases
            // the line when zoomed out), so all four draw paths now agree.
            linestyle: 0,
            showLabel: false,
            extendLeft: false,
            extendRight: false,
          },
        }
      );
      if (entityId !== null && entityId !== undefined) entityIds.push(String(entityId));
    } catch (err) {
      console.warn(`[GhostLine] Segment ${i} failed:`, err);
    }
  }

  // NOTE: we intentionally do NOT call setVisibleRange here. The user owns the
  // zoom; the projection length itself scales with the visible range (computed
  // upstream), so the line stays proportional without us fighting their pan/
  // zoom. Forcing a range here also caused a feedback loop with the zoom
  // subscription that drives redraws.

  debugLog('[GhostLine] Total segments drawn:', entityIds.length);
  return entityIds;
}

// ── Draw-commit helper ──────────────────────────────────────────────────

/**
 * Decide the next tracked-id set and which ids to remove now, given the
 * outcome of a double-buffered draw.
 *
 * Drawing is async and slow (one IPC round-trip into the TradingView iframe
 * per segment). If we cleared the OLD line before drawing the NEW one, the
 * chart would be empty for the whole draw window — the line visibly vanishes
 * then reappears segment-by-segment = the "flicker / appears then disappears"
 * artefact. Instead we draw the new line FIRST, then swap, then remove the old
 * one, so there is never a frame where zero lines are on the chart.
 *
 * This helper is pure (no chart access) so it can be unit-tested without a
 * TradingView widget mock. It is called from the production draw path so the
 * unit tests guard the real id-lifecycle invariants, not a shadow copy.
 *
 * @param prevIds The ids that were on the chart BEFORE this draw started.
 * @param newIds The ids this draw just created (may be empty if it aborted).
 * @param stale  True if a newer run superseded this one while/after drawing.
 * @returns
 *   - `next`: the ids now on the chart (who owns it now).
 *   - `removeNow`: the ids the caller should remove from the chart immediately.
 *     On success these are the prev ids; on a stale-after-draw these are the
 *     newly-drawn ids (the stale run hands ownership back to the prior run).
 *   The caller is responsible for folding any removeNow ids that FAIL to
 *   remove back into `next` (the self-healing retry), since this helper has no
 *   chart access.
 */
export function commitDraw(
  prevIds: string[],
  newIds: string[],
  stale: boolean
): { next: string[]; removeNow: string[] } {
  if (stale) {
    // A newer run owns the chart. Throw away our just-drawn ids (the caller
    // removes them) and leave the prior ids in place — those still represent
    // the last good line and the newer run is responsible for replacing them.
    return { next: prevIds, removeNow: newIds };
  }
  // Success: the new line is the source of truth. Remove the old line now that
  // the new one is already on the chart (zero empty frames).
  return { next: newIds, removeNow: prevIds };
}

// ── Single-entity draw ───────────────────────────────────────────────────

/** Ghost line colour. Amber is the projection's identity on the chart. */
const GHOST_COLOR = '#f59e0b';

/**
 * SOLID, on every draw path.
 *
 * A dash pattern is a fixed pixel period (~8px). The projection's horizontal
 * extent per segment is one bar of spacing, which shrinks as the user zooms
 * out: at 200 visible bars a 1200px pane gives 6px per bar and at 400 bars just
 * 3px — below one dash cell per segment, so the stroke degrades into sparse
 * dots and then effectively disappears. That is the "line becomes very thin to
 * notice" report, and it is why the segment fallback below already forced
 * solid. The polyline path had kept `linestyle: 2`, so the SAME feature looked
 * different depending on which draw path happened to run. One constant now
 * feeds both: the ghost's identity is its amber colour, not its dashes.
 */
const GHOST_LINE_STYLE = 0; // LineStyle.Solid
const GHOST_LINE_WIDTH = 2;

/**
 * Draw the whole projection as ONE chart entity and return its id.
 *
 * Straight engines (`linear` / `volume`) are a `trend_line` from the anchor to
 * the end point — a rigid vector that cannot bend. Curved engines are a
 * `polyline` through every projected point. Verified against the vendored
 * TradingView Advanced Charts v32.1 bundle: `polyline` with
 * `fillBackground: false, filled: false` renders an open dashed curve that
 * extends into the future whitespace on 2m, 10m, 75m and 1W, so the older
 * per-pair `trend_line` segments (~20 awaited IPC round-trips per redraw, with
 * dash patterns restarting at every vertex) are no longer needed. Should
 * `polyline` ever fail, `path` is tried, then the segment fallback.
 *
 * Returns `null` when nothing could be drawn.
 */
async function drawGhostEntity(
  chart: any,
  points: { time: number; price: number }[],
  singleSegment: boolean
): Promise<string | null> {
  // Strictly-increasing, de-duplicated points (a session boundary can produce
  // two points at the same timestamp, which TradingView rejects).
  const clean: { time: number; price: number }[] = [];
  for (const p of points) {
    if (clean.length === 0 || p.time > clean[clean.length - 1].time) clean.push(p);
  }
  if (clean.length < 2) return null;

  debugLog(
    '[GhostLine] DRAW',
    clean.length,
    'pts times=',
    clean.map((p) => p.time).join(','),
    'prices=',
    clean.map((p) => p.price).join(',')
  );

  const base = { lock: true, disableSelection: true, disableSave: true, disableUndo: true };

  if (singleSegment) {
    const id = await chart.createMultipointShape([clean[0], clean[clean.length - 1]], {
      ...base,
      shape: 'trend_line',
      overrides: {
        linecolor: GHOST_COLOR,
        linewidth: GHOST_LINE_WIDTH,
        linestyle: GHOST_LINE_STYLE,
        showLabel: false,
        extendLeft: false,
        extendRight: false,
      },
    });
    return id == null ? null : String(id);
  }

  try {
    const id = await chart.createMultipointShape(clean, {
      ...base,
      shape: 'polyline',
      overrides: {
        linecolor: GHOST_COLOR,
        linewidth: GHOST_LINE_WIDTH,
        linestyle: GHOST_LINE_STYLE,
        fillBackground: false,
        filled: false,
        transparency: 0,
      },
    });
    if (id != null) return String(id);
  } catch (err) {
    console.warn('[GhostLine] polyline failed, trying path:', err);
  }
  try {
    const id = await chart.createMultipointShape(clean, {
      ...base,
      shape: 'path',
      overrides: {
        lineColor: GHOST_COLOR,
        lineWidth: GHOST_LINE_WIDTH,
        lineStyle: GHOST_LINE_STYLE,
        leftEnd: 0,
        rightEnd: 0,
      },
    });
    if (id != null) return String(id);
  } catch (err) {
    console.warn('[GhostLine] path failed, falling back to segments:', err);
  }
  // Last resort: consecutive trend_line segments, the pre-polyline approach.
  const ids = await drawGhostSegments(chart, clean, false, () => false);
  return ids.length > 0 ? ids.join('+') : null;
}

/**
 * Owns the ghost entity on the chart for the lifetime of a widget.
 *
 * The previous design tracked entity ids in refs inside the draw effect and
 * removed them in that effect's CLEANUP. Because the effect re-runs on every
 * pulse / new bar / zoom, every redraw began by wiping the line, and a
 * "points unchanged — skip redraw" early-return then left the chart EMPTY
 * until something else changed: the line flickered, and periodically vanished
 * for a whole bar. Here the entity outlives the effect: `render` draws the new
 * entity FIRST and only then removes the previous one (true double buffer),
 * and `clear` runs only on widget teardown, symbol/timeframe change, feature
 * lock, or an empty projection — never on a routine redraw.
 *
 * Ids that fail to remove are retried on the next pass, bounded by
 * `pruneFailedIds` so an id from a torn-down widget cannot pile up forever.
 */
export class GhostLineRenderer {
  /** Ids currently on the chart (normally exactly one). */
  private ids: string[] = [];
  private attempts = new Map<string, number>();
  private lastPoints: { time: number; price: number }[] = [];

  constructor(private readonly chart: any) {}

  /** Points of the entity currently on the chart (for the skip-redraw check). */
  get points(): { time: number; price: number }[] {
    return this.lastPoints;
  }

  /**
   * Replace whatever is on the chart with `points`. `isStale` is consulted
   * after the awaited draw; a stale run removes what it just drew and leaves
   * the previous entity in place, since a newer run owns the chart now.
   */
  async render(
    points: { time: number; price: number }[],
    singleSegment: boolean,
    isStale: () => boolean
  ): Promise<boolean> {
    const prevIds = this.ids;
    let newId: string | null = null;
    try {
      newId = await drawGhostEntity(this.chart, points, singleSegment);
    } catch (err) {
      console.warn('[GhostLine] draw failed:', err);
    }
    const newIds = newId ? newId.split('+') : [];
    const stale = isStale();
    const { next, removeNow } = commitDraw(prevIds, newIds, stale);
    const failed = removeGhostSegments(this.chart, removeNow);
    this.ids = [...next, ...pruneFailedIds(failed, this.attempts, 2, next)];
    if (!stale && newIds.length > 0) this.lastPoints = points;
    return !stale && newIds.length > 0;
  }

  /** Remove the ghost entity. Failed removes stay tracked for one retry. */
  clear(): void {
    const failed = removeGhostSegments(this.chart, this.ids);
    this.ids = pruneFailedIds(failed, this.attempts, 2, this.ids);
    this.lastPoints = [];
  }

  /** The chart is gone; forget everything (its ids can never be removed). */
  dispose(): void {
    this.ids = [];
    this.attempts.clear();
    this.lastPoints = [];
  }
}

// ── Main Hook ─────────────────────────────────────────────────────────────

export function useGhostLine(widget: any, activeSymbol: string, effectiveTimeframe: string) {
  const ghostLineMode = useChartUIStore((s) => s.ghostLineMode);
  const ghostlineEnabled = useFeature('ghostline');

  // Redraw triggers (lightweight so we don't thrash the async shape API):
  //   · lastBarTime advances only when a NEW bar forms for this symbol.
  //
  // NOTE: predictive signals are intentionally NOT a reactive redraw trigger.
  // They are read via `useTradeStore.getState().predictiveSignals` inside the
  // main effect (a non-reactive read), so a streaming signal does NOT re-fire
  // the effect. Previously a `predictiveKey` selector made every predictive
  // tick re-fire the effect immediately, bypassing the `pulse` throttle and
  // causing a redraw storm. Signals are now consumed only on the throttled
  // cadence (lastBarTime / pulse / zoomPulse / mode·symbol·timeframe changes).
  const lastBarTime = useTradeStore((s) => {
    const sym = activeSymbol.toUpperCase();
    let t = 0;
    for (const c of s.ohlcCandles) {
      if (c.symbol?.toUpperCase() === sym && c.start_timestamp_ms > t) t = c.start_timestamp_ms;
    }
    return t;
  });

  // The one owner of what is on the chart, bound to the widget's lifetime — see
  // `GhostLineRenderer` for why ownership must outlive the draw effect.
  const rendererRef = useRef<GhostLineRenderer | null>(null);
  // Consecutive `rejected` projections. A rejection keeps the previous line
  // (a single volatile tick must not blank the chart), but a projection that is
  // persistently invalid must not leave a stale line up forever.
  const rejectStreakRef = useRef(0);
  // Monotonic draw generation. Any run whose generation is no longer the latest
  // is "stale": it won't start a draw, and hands the chart back if it already
  // drew.
  const genRef = useRef<number>(0);

  useEffect(() => {
    if (!widget) return;
    let cancelled = false;
    whenChartReady(
      widget,
      () => {
        if (cancelled) return;
        try {
          const chart = widget.activeChart();
          if (chart) rendererRef.current = new GhostLineRenderer(chart);
        } catch {
          /* torn down */
        }
      },
      () => cancelled,
      'GhostLine'
    );
    return () => {
      cancelled = true;
      const r = rendererRef.current;
      rendererRef.current = null;
      if (!r) return;
      // Best-effort removal if the chart is still alive; either way the ids
      // belong to this widget and must not survive into the next one.
      try {
        if (widget.activeChart()) r.clear();
      } catch {
        /* widget already removed */
      }
      r.dispose();
    };
  }, [widget]);

  // A different symbol or timeframe is a different series: the old projection
  // has nothing to do with the new candles, so clear it rather than leave it
  // on the chart until the first new draw lands.
  useEffect(() => {
    return () => {
      try {
        rendererRef.current?.clear();
      } catch {
        /* torn down */
      }
    };
  }, [activeSymbol, effectiveTimeframe]);

  // ── Zoom pulse ───────────────────────────────────────────────────────
  // Re-project when the user zooms so the line length tracks the visible
  // range. Throttled to 900ms so a drag doesn't thrash the async shape API.
  //
  // We IGNORE programmatic auto-scroll: TradingView slides the right edge
  // forward as live bars arrive, which fires `onVisibleRangeChanged` too. A
  // new bar already bumps `lastBarTime` (a redraw dep), so pulsing here on top
  // of that caused 2–3 concurrent redraws per new bar — the "ghost line
  // thrash". `shouldPulseOnRangeChange` pulses only when the visible range
  // WIDTH changes (a real user zoom); constant-width slides (auto-scroll on
  // a new bar, or a width-preserving pan that doesn't change the projection
  // length) are skipped.
  const [zoomPulse, setZoomPulse] = useState(0);
  useEffect(() => {
    if (!widget) return;
    const token = {}; // unique owner for unsubscribeAll
    let lastZoom = 0;
    let prevRange: { from: number; to: number } | null = null;
    // `disposed` guards the race where this effect cleans up BEFORE
    // `onChartReady` fires: if so, we never subscribe, and we never call
    // `setZoomPulse` on an unmounted effect.
    let disposed = false;
    // The unsubscribe handler from `subscribe`. Kept outside the ready
    // callback so cleanup can unsubscribe even if the chart became ready AFTER
    // cleanup began (otherwise the subscription leaks until the widget dies).
    let unsub: (() => void) | null = null;
    let subscribed = false;
    // `whenChartReady` guards the INVOCATION too, not just the callback body.
    // The bare `widget.onChartReady(...)` this replaces threw a TypeError when
    // the widget had already been removed, because the guards all lived inside
    // the callback. It also uses the non-deprecated `chartReady()` promise.
    whenChartReady(widget, () => {
      // Cleanup already ran — do NOT subscribe (would leak + setState on dead
      // effect).
      if (disposed) return;
      try {
        const stream = widget.activeChart().onVisibleRangeChanged();
        stream.subscribe(token, () => {
          let vr: { from: number; to: number } | null = null;
          try {
            const r = widget.activeChart().getVisibleRange();
            if (r && Number.isFinite(r.from) && Number.isFinite(r.to)) {
              vr = { from: r.from, to: r.to };
            }
          } catch {
            /* range not ready yet */
          }
          if (vr === null) return;
          if (!shouldPulseOnRangeChange(prevRange, vr)) {
            // Still remember the range so the next genuine change is detected
            // against the latest position, not the stale baseline.
            prevRange = vr;
            return;
          }
          prevRange = vr;
          const now = Date.now();
          if (now - lastZoom < 900) return; // throttle to ≤ ~1.1 / s
          lastZoom = now;
          setZoomPulse((p) => p + 1);
        });
        subscribed = true;
        unsub = () => {
          try {
            stream.unsubscribeAll(token);
          } catch {
            /* torn down */
          }
        };
      } catch {
        /* ignore */
      }
    });
    return () => {
      disposed = true;
      // If `onChartReady` already subscribed, drop the subscription via the
      // captured handler (the very same stream instance we subscribed to).
      // If `onChartReady` hasn't fired yet, `disposed` stops it from
      // subscribing later. `subscribed` is only ever set together with `unsub`
      // (consecutive lines in the same try block), so the bare-`subscribed`
      // branch is a defensive fallback in case a future edit splits them.
      if (subscribed && unsub) {
        unsub();
      } else if (subscribed) {
        try {
          widget.activeChart().onVisibleRangeChanged().unsubscribeAll(token);
        } catch {
          /* torn down */
        }
      }
    };
  }, [widget]);

  // ── Realtime pulse ───────────────────────────────────────────────────
  // Re-project intra-bar as the live price ticks.
  //
  // Throttled to PULSE_THROTTLE_MS — see that constant for the reasoning.
  const [pulse, setPulse] = useState(0);
  const lastCloseRef = useRef(0);
  const lastPulseRef = useRef(0);
  /**
   * True while the draw effect is mid-flight.
   *
   * A pulse re-runs the draw effect. The draw is an awaited `exportData` read
   * plus an awaited shape creation into the TradingView iframe, so it can be
   * slower than the pulse interval: with a live price ticking, runs used to be
   * superseded before they could finish, so a draw never completed and no ghost
   * line was ever visible. Nothing was wrong with the projection — it just never
   * got to render.
   *
   * Interrupting a draw to start an identical-but-newer one gains nothing, so a
   * pulse that lands mid-draw is remembered instead of applied, and fired once
   * the draw finishes. Each draw therefore completes, and the redraw cadence
   * self-limits to the real cost of a draw rather than a fixed timer.
   */
  const drawInFlightRef = useRef(false);
  /** A price moved while a draw was in flight; re-pulse when it finishes. */
  const pendingPulseRef = useRef(false);
  useEffect(() => {
    const sym = activeSymbol.toUpperCase();
    const unsub = useTradeStore.subscribe((s) => {
      let close = 0;
      let t = 0;
      for (const c of s.ohlcCandles) {
        if (c.symbol?.toUpperCase() === sym && c.start_timestamp_ms > t) {
          t = c.start_timestamp_ms;
          close = c.close;
        }
      }
      if (close === 0 || close === lastCloseRef.current) return;
      lastCloseRef.current = close;
      const now = Date.now();
      if (now - lastPulseRef.current < PULSE_THROTTLE_MS) return;
      // Let the in-flight draw finish and re-pulse from its completion instead.
      if (drawInFlightRef.current) {
        pendingPulseRef.current = true;
        return;
      }
      lastPulseRef.current = now;
      setPulse((p) => p + 1);
    });
    return () => unsub();
  }, [activeSymbol]);

  useEffect(() => {
    if (!widget) {
      debugLog('[GhostLine] widget is null — skipping');
      return;
    }

    // Feature gate: fail closed until plan + deployment switch unlock ghostline.
    if (!ghostlineEnabled) {
      debugLog('[GhostLine] feature locked — clearing');
      let cancelled = false;
      whenChartReady(
        widget,
        () => {
          if (cancelled) return;
          try {
            rendererRef.current?.clear();
          } catch {
            /* torn down */
          }
        },
        () => cancelled,
        'GhostLine'
      );
      return () => {
        cancelled = true;
      };
    }

    debugLog(
      '[GhostLine] useEffect fired — symbol=',
      activeSymbol,
      'tf=',
      effectiveTimeframe,
      'mode=',
      ghostLineMode
    );

    // This run owns generation `myGen`. It becomes stale the moment a newer run
    // bumps genRef, or when this effect is cleaned up (`cancelled`).
    let cancelled = false;
    const myGen = ++genRef.current;
    const isStale = () => cancelled || genRef.current !== myGen;

    whenChartReady(
      widget,
      async () => {
        // Only the latest generation is allowed to draw. A superseded run bails
        // here before touching the chart, so two runs never both render.
        if (isStale()) return;

        // The widget can be torn down between the time the ready callback was
        // scheduled and now. Guard against a nulled-out `widget._tradingViewApi`
        // (and other internal tear-down state) before touching the chart.
        if (!widget || !(widget as any).activeChart) return;
        let chart: any;
        try {
          chart = widget.activeChart();
        } catch (err) {
          console.warn('[GhostLine] activeChart() threw — widget torn down:', err);
          return;
        }
        if (!chart) return;
        // The widget effect above normally has the renderer ready first; cover
        // the ordering where this effect's ready callback lands earlier.
        if (!rendererRef.current) rendererRef.current = new GhostLineRenderer(chart);
        const renderer = rendererRef.current;

        // Read the CURRENT zoom window so the projection length can scale to it.
        // `from` is a UNIX-second timestamp of the left edge of the view.
        let visibleFromSec = 0;
        try {
          const vr = chart.getVisibleRange();
          if (vr && Number.isFinite(vr.from) && Number.isFinite(vr.to) && vr.to > vr.from) {
            visibleFromSec = vr.from;
          }
        } catch {
          /* chart not ready to report a range yet */
        }

        // How much empty space exists to the RIGHT of the last bar. The
        // projection is drawn into that whitespace, so it is the real ceiling
        // on a visible projection — see `clampProjectionBars`.
        let maxProjectionBars = clampProjectionBars(NaN);
        try {
          const offset = chart.timeScale?.().rightOffset?.();
          if (Number.isFinite(offset)) maxProjectionBars = clampProjectionBars(offset as number);
        } catch {
          /* older bundle without timeScale() — keep the default ceiling */
        }

        // Read signals at run-time (not as a render subscription) so the effect
        // isn't re-fired by every predictive tick's new array reference.
        const predictiveSignals = useTradeStore.getState().predictiveSignals;

        // From here to the `finally` below is the slow part: reading the chart's
        // series, projecting, then one awaited IPC round-trip for the entity. A
        // live price pulse arriving inside this window must not restart it —
        // see `drawInFlightRef`.
        drawInFlightRef.current = true;
        try {
          const result = await computeGhostProjection(
            activeSymbol,
            effectiveTimeframe,
            ghostLineMode,
            predictiveSignals,
            visibleFromSec,
            chart,
            maxProjectionBars
          );
          if (isStale()) return;

          // A REJECTED candidate is not a reason to blank the chart. The bounds
          // guard fires on a single volatile tick, and clearing here is what
          // made the line disappear and come back. Keep the last good entity and
          // try again on the next redraw — but not forever: after
          // MAX_CONSECUTIVE_REJECTS the projection is persistently invalid and a
          // stale line would be worse than none.
          if (result.kind === 'rejected') {
            rejectStreakRef.current += 1;
            if (rejectStreakRef.current >= MAX_CONSECUTIVE_REJECTS) {
              console.warn(
                `[GhostLine] ${rejectStreakRef.current} consecutive rejections (${result.reason}) — clearing`
              );
              renderer.clear();
            } else {
              debugLog('[GhostLine] projection rejected — keeping previous line:', result.reason);
            }
            return;
          }

          if (result.kind === 'empty') {
            // Nothing to show — clear the old line. (This is the one case where
            // an empty chart is correct.)
            debugLog('[GhostLine] nothing to draw:', result.reason);
            rejectStreakRef.current = 0;
            renderer.clear();
            return;
          }

          rejectStreakRef.current = 0;
          const points = result.points;

          // Unchanged projection → skip the IPC round-trip. The entity stays on
          // the chart because nothing here removes it.
          if (pointsUnchanged(points, renderer.points)) {
            debugLog('[GhostLine] points unchanged — skip redraw');
            return;
          }

          // Straight engines (OLS 'linear' / VWLR 'volume') render as a single
          // trend_line (anchor → end) that can never bend. Curved engines
          // ('curved' / 'forecast') render as one polyline through every point.
          const isStraight = ghostLineMode === 'linear' || ghostLineMode === 'volume';
          const drawn = await renderer.render(points, isStraight, isStale);
          if (drawn) debugLog('[GhostLine] Ghost line ready:', points.length, 'points');
        } catch (err) {
          console.error('[GhostLine] draw failed:', err);
        } finally {
          drawInFlightRef.current = false;
          // A price moved while we were drawing. Apply it now that the chart holds
          // a complete line, so the projection still tracks the live market — just
          // at the cadence a draw can actually sustain instead of a fixed timer
          // that outran it. Skipped when stale: a newer run already owns the chart
          // and will draw the fresher price itself.
          if (pendingPulseRef.current && !isStale()) {
            pendingPulseRef.current = false;
            lastPulseRef.current = Date.now();
            setPulse((p) => p + 1);
          }
        }
      },
      isStale,
      'GhostLine'
    );

    return () => {
      // Mark stale so an in-flight run hands the chart back instead of
      // committing. The entity itself is NOT removed here: routine re-runs
      // (pulse / new bar / zoom) must leave the current line on the chart until
      // the next one is drawn. Removal is owned by the widget, symbol/timeframe
      // and feature-lock effects above.
      cancelled = true;
      // Backstop for the in-flight flag: cleanup always runs before the next
      // effect run, so clearing here bounds a leaked flag to nothing.
      drawInFlightRef.current = false;
    };
  }, [
    widget,
    activeSymbol,
    effectiveTimeframe,
    ghostLineMode,
    lastBarTime,
    pulse,
    zoomPulse,
    ghostlineEnabled,
  ]);
}
