// Find Trade launches these supporting requests only after its shared preflight.
// Each protected route still needs its own authoritative refusal so a direct
// request cannot bypass the account-credit boundary.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../tools/[...path]/route';

function ctx(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function req(path: string): Request {
  return new Request(`http://localhost/api/tools/${path}`, {
    method: 'POST',
    headers: { cookie: 'access_token=tok', 'content-type': 'application/json' },
    body: '{}',
  });
}

function creditOk(credits: number) {
  return { ok: true, json: async () => ({ success: true, data: { credits } }) } as Response;
}

function upstreamOk() {
  return new Response('{"ok":true}', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  process.env.QUANT_TOOL_SERVER_URL = 'http://tool-server:8084/tools';
});

afterEach(() => {
  delete process.env.QUANT_TOOL_SERVER_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('tools route — account credits', () => {
  it.each(['get_consensus', 'get_multi_tf_chart_patterns'])(
    '402s /%s and never contacts tool-server when the balance is exhausted',
    async (path) => {
      const fetchMock = vi.fn().mockResolvedValue(creditOk(0));
      vi.stubGlobal('fetch', fetchMock);

      const res = await POST(req(path), ctx([path]));

      expect(res.status).toBe(402);
      expect(((await res.json()) as { error: string }).error).toContain('Top up');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain('/credit/');
    }
  );

  it('forwards a protected tool when the balance is positive', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return url.includes('/credit/') ? creditOk(1) : upstreamOk();
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(req('get_consensus'), ctx(['get_consensus']));

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not credit-gate unrelated tool actions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(upstreamOk());
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(req('scan_radar'), ctx(['scan_radar']));

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/tools/scan_radar');
  });
});