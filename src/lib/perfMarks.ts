/**
 * Startup timeline: how long from navigation to the first LIVE bar on the chart.
 *
 * Five `performance.mark`s along the serial chain (auth â†’ TV script â†’ widget â†’
 * history â†’ first tick). Each fires once; the last one prints the whole table
 * so a single console read says which stage dominates. Free when nothing is
 * listening: `performance.mark` is a ring-buffer write.
 */
const STAGES = ['auth-ok', 'tv-script-ready', 'widget-ready', 'first-history', 'first-live-bar'] as const;
type Stage = (typeof STAGES)[number];

const done = new Set<Stage>();

export function markOnce(stage: Stage): void {
  if (typeof performance === 'undefined' || done.has(stage)) return;
  done.add(stage);
  performance.mark(`stratai:${stage}`);
  if (stage !== 'first-live-bar') return;

  const rows: Record<string, string> = {};
  for (const s of STAGES) {
    const m = performance.getEntriesByName(`stratai:${s}`)[0];
    rows[s] = m ? `${Math.round(m.startTime)} ms` : 'n/a';
  }
  console.info('[StartupTimeline] ms since navigation start', rows);
}

/** Test/HMR only. */
export function __resetPerfMarks(): void {
  done.clear();
}