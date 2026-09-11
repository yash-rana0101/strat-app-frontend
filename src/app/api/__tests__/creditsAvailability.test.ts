import { afterEach, describe, expect, it, vi } from 'vitest';

import { CREDIT_EXHAUSTED_MESSAGE } from '../_credits';
import { GET } from '../credits/availability/route';

function req(): Request {
  return new Request('http://localhost/api/credits/availability', {
    headers: { cookie: 'access_token=tok' },
  });
}

function creditResponse(credits: unknown): Response {
  return {
    ok: true,
    json: async () => ({ success: true, data: { credits } }),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('credits availability preflight', () => {
  it('returns the shared 402 response when the balance is exhausted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(creditResponse(0)));

    const res = await GET(req());

    expect(res.status).toBe(402);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({ error: CREDIT_EXHAUSTED_MESSAGE });
  });

  it('approves a positive finite balance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(creditResponse(1)));

    const res = await GET(req());

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({ availability: 'available' });
  });

  it.each([
    ['account API failure', () => Promise.reject(new Error('account API unavailable'))],
    ['malformed balance', () => Promise.resolve(creditResponse('not-a-number'))],
  ])('fails open as unknown on %s', async (_case, result) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(result));

    const res = await GET(req());

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({
      availability: 'unknown',
      message: CREDIT_EXHAUSTED_MESSAGE,
    });
  });
});