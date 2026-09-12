// app/api/preferences/[...path]/route.ts — same-origin proxy for StratAI-preference granular endpoints.
//
// Proxies granular preference resources:
//   /api/preferences/layout — Panel widths and collapsed states
//   /api/preferences/window — Active symbol, timeframe, indicators & chart state
//   /api/preferences/watchlists — User-curated custom watchlists
//   /api/preferences/sessions — Multi-session tabs & active tab management
//   /api/preferences/trades — Committed trade plans & setups
//   /api/preferences/trade-results — Executed trade outcomes with rawData object
//   /api/preferences/quant-radar — AI sentiment, consensus & pattern scanner state
//   /api/preferences/localstorage/sync — Browser localStorage mirror & cloud sync
//   /api/preferences/health — Service and MongoDB connection status

import { proxyError } from '../../_gateway';
import { resolveUserId } from '../../_identity';
import { proxyRequest, resolveCatchAll } from '../../_proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: Request, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  const resolved = resolveCatchAll(path, req);
  if (!resolved) {
    return proxyError(400, 'preferences: a path segment is required');
  }

  const firstSegment = (path?.[0] ?? '').toLowerCase();
  const upstreamPath =
    firstSegment === 'health' || firstSegment === 'ready'
      ? resolved
      : `/preferences${resolved}`;

  const userId = await resolveUserId(req);
  const clientUserId = req.headers.get('x-user-id');
  const targetUserId = userId || clientUserId;
  const extraHeaders: Record<string, string> = {};
  if (targetUserId) {
    extraHeaders['X-User-Id'] = targetUserId;
  }

  return proxyRequest(req, 'preferences', {
    path: upstreamPath,
    extraHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
