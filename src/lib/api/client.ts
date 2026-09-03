// lib/api/client.ts — the authenticated transport to the Strat AI API.
//
// Authentication is the `.stratai.live` cookie pair, not a bearer token: every
// request carries `credentials: 'include'` and the browser attaches
// `access_token` for us. There is nothing to read, store, or attach by hand,
// which is the whole point — the previous version kept the access and refresh
// tokens in `localStorage` and set `Authorization` per call, so any XSS on this
// origin was a session theft.
//
// The API accepts either form (`verifyJWT` reads `req.cookies.access_token`
// before falling back to the `Authorization` header), so this is a client-side
// change only.

import { API_BASE_URL, API_V1_PREFIX } from '../env';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError, type ApiResponse } from './types';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Send credentials and refresh on 401. Default true. */
  auth?: boolean;
  headers?: Record<string, string>;
};

/**
 * Single-flight refresh. Concurrent 401s share one refresh call rather than
 * each racing to rotate the refresh token — with rotation, parallel refreshes
 * invalidate each other and log the user out mid-session.
 */
let refreshPromise: Promise<void> | null = null;

/**
 * Ask the API to mint a new access cookie from the refresh cookie.
 *
 * No token is passed or returned: the refresh token arrives as a cookie and the
 * new access token is set as one. A failure means the session is genuinely over,
 * so the local state is cleared — but this does NOT redirect. Deciding where an
 * unauthenticated user goes belongs to the app shell (`app/page.tsx`), not to
 * every stray background request that happens to notice first.
 */
async function refreshSession(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE_URL}${API_V1_PREFIX}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      // The endpoint reads `req.cookies.refresh_token || req.body.refresh`; the
      // cookie path is the one in use, so the body is deliberately empty.
      body: '{}',
    });

    if (!res.ok) {
      useAuthStore.getState().clearSession();
      throw new ApiError('Session expired', res.status);
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Run `send`, and if it answers 401, mint a fresh access cookie and retry once.
 *
 * WHY THIS EXISTS, and why it lives here rather than in the caller.
 *
 * The same-origin `/api/deepquant/*` tier resolves the caller from the httpOnly
 * `access_token` cookie (`app/api/_identity.ts`) and mints the assertion deep-quant
 * verifies. That resolver had no refresh: it called `/users/me` once, and a 401 there
 * meant "no identity", so it forwarded UNMINTED. The whole session surface hard-requires
 * an assertion (`session_api.py::_caller` has no body-`user_id` fallback even with
 * `DEEP_QUANT_REQUIRE_IDENTITY` off), so the moment the short-lived access token expired,
 * every session call — the list, `/run`, `/qa` — answered 401. Measured in production:
 * a `/qa` at 200, then twenty minutes of idle, then the same `/qa` at 401.
 *
 * The browser is the right place to fix it because the browser owns the cookie. The auth
 * API rotates the refresh token, so a server-side refresh in the route handler would have
 * to relay `Set-Cookie` back or it would invalidate the browser's copy and log the user
 * out. Refreshing here updates the cookie jar natively and needs no relay.
 *
 * Retrying the send is safe on the two POSTs that matter: a 401 is refused at the route
 * tier before any upstream work happens, and `/qa` and `/run` are both idempotent on
 * `client_msg_id` server-side.
 *
 * ponytail: costs one wasted round trip per expiry. Proactive refresh on a timer only if
 * that shows up as latency — it cannot, since the token outlives a typical turn.
 */
export async function fetchWithRefresh(send: () => Promise<Response>): Promise<Response> {
  const res = await send();
  if (res.status !== 401) return res;
  try {
    await refreshSession();
  } catch {
    // The session is genuinely over (`refreshSession` has already cleared local state).
    // Surface the original 401 rather than a refresh error: the caller's job is to report
    // that this request was unauthenticated, not to explain the refresh attempt.
    return res;
  }
  return send();
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json) {
    throw new ApiError('Invalid response from server', res.status);
  }
  if (!json.success) {
    throw new ApiError(json.message || `Request failed with status ${res.status}`, res.status);
  }
  return json.data;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, auth = true, headers = {} } = options;

  const url = `${API_BASE_URL}${API_V1_PREFIX}${path}`;
  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const buildInit = (): RequestInit => {
    const init: RequestInit = {
      method,
      headers: finalHeaders,
      signal,
      // Cross-origin to api-web.stratai.live, so the cookie only rides along
      // with `include`. `same-origin` (the default) would silently send an
      // unauthenticated request and read as a logged-out user.
      credentials: auth ? 'include' : 'same-origin',
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    return init;
  };

  const res = await fetch(url, buildInit());

  if (res.status === 401 && auth) {
    // Refresh, then retry exactly once. A 401 on the retry is a real answer, not
    // a stale access token, so it surfaces to the caller instead of looping.
    await refreshSession();
    return parseEnvelope<T>(await fetch(url, buildInit()));
  }

  return parseEnvelope<T>(res);
}
