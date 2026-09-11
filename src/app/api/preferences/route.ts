// app/api/preferences/route.ts — same-origin proxy to StratAI-preference microservice.
//
// Serves root user preference operations:
//   GET /api/preferences — Retrieve unified user state
//   PUT /api/preferences — Replace complete preferences
//   PATCH /api/preferences — Partial merge into preferences
//   DELETE /api/preferences — Remove all preferences for user

import { resolveUserId } from '../_identity';
import { proxyRequest } from '../_proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(req: Request): Promise<Response> {
  const userId = await resolveUserId(req);
  const extraHeaders: Record<string, string> = {};
  if (userId) {
    extraHeaders['X-User-Id'] = userId;
  }

  // Pass-through to upstream preferences service at /preferences
  return proxyRequest(req, 'preferences', {
    path: '/preferences',
    extraHeaders,
  });
}

export const GET = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
