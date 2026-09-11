// app/api/credits/availability/route.ts — server-only Find Trade credit preflight.
//
// Supporting sentiment, technical consensus, and pattern requests must not be
// launched until the account API has approved the same button press. Their own
// route checks remain authoritative defense in depth against direct requests.

import {
  CREDIT_EXHAUSTED_MESSAGE,
  creditsExhaustedResponse,
  resolveCreditAvailability,
} from '../../_credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const availability = await resolveCreditAvailability(req);
  if (availability === 'exhausted') return creditsExhaustedResponse();

  return Response.json(
    {
      availability,
      message: availability === 'unknown' ? CREDIT_EXHAUSTED_MESSAGE : undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}