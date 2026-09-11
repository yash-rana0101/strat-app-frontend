// app/api/tools/[...path]/route.ts — same-origin proxy to the standalone quant
// tool server (`tool-server/`, :8084).
//
// Browser analogue of the Tauri-embedded `quant/tool_server.rs`. The deployed
// crate is Tauri-free and shares `quant-core` with the desktop build, so the
// analytics the website gets here are computed by the SAME code as on desktop —
// chart patterns, support/resistance, prediction, consensus, candles — rather
// than a reimplementation that could drift.

import { denyIfCreditsExhausted } from '../../_credits';
import { proxyError } from '../../_gateway';
import { proxyRequest, resolveCatchAll } from '../../_proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };

const CREDIT_PROTECTED_TOOLS = new Set(['get_consensus', 'get_multi_tf_chart_patterns']);

/** AI-workflow side computations that must not run after credits reach zero. */
export function isCreditProtectedTool(req: Request, path?: string[]): boolean {
  return (
    req.method.toUpperCase() === 'POST' &&
    CREDIT_PROTECTED_TOOLS.has((path?.[0] ?? '').toLowerCase())
  );
}

async function handle(req: Request, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  const resolved = resolveCatchAll(path, req);
  if (!resolved) return proxyError(400, 'tools: a path segment is required');

  if (isCreditProtectedTool(req, path)) {
    const deniedForCredits = await denyIfCreditsExhausted(req);
    if (deniedForCredits) return deniedForCredits;
  }

  return proxyRequest(req, 'tools', { path: resolved });
}

export const GET = handle;
export const POST = handle;
