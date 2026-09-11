// app/api/_credits.ts — SERVER-ONLY account-credit lookup for chargeable AI actions.
//
// The browser's cached credit value is presentation state, not an authorization
// boundary. This helper asks the account API that owns the balance immediately
// before an AI request is forwarded, using only the caller's access-token cookie.

import { API_BASE_URL, API_V1_PREFIX } from '../../lib/env';
import { readCookie } from './_identity';

/** A valid account response can answer yes/no; every other outcome is unknown. */
export type CreditAvailability = 'available' | 'exhausted' | 'unknown';

/**
 * Resolve whether the caller has a positive Strat AI credit balance.
 *
 * `unknown` deliberately fails open. The credit API is an external dependency,
 * and an outage or contract mismatch must not turn every AI action into a false
 * "credits exhausted" refusal. A valid, successful response reporting zero or a
 * negative balance is the only evidence strong enough to return `exhausted`.
 */
export async function resolveCreditAvailability(req: Request): Promise<CreditAvailability> {
  const token = readCookie(req.headers.get('cookie'), 'access_token');
  if (!token) return 'unknown';

  try {
    const res = await fetch(`${API_BASE_URL}${API_V1_PREFIX}/credit/`, {
      method: 'GET',
      headers: { Cookie: `access_token=${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return 'unknown';

    const body = (await res.json().catch(() => null)) as {
      success?: boolean;
      data?: { credits?: unknown };
    } | null;
    const credits = body?.success === true ? body.data?.credits : undefined;
    if (typeof credits !== 'number' || !Number.isFinite(credits)) return 'unknown';

    return credits <= 0 ? 'exhausted' : 'available';
  } catch {
    return 'unknown';
  }
}