// store/sessionCancellation.ts — shared cancellation registry for deep-quant agent runs.
//
// Tracks cancelled session IDs and thread IDs so incoming stream frames are dropped
// immediately, and provides instant cancellation helpers for both multi-session and legacy stores.

import type { ReasoningStep } from './useQuantStore';

export const cancelledSessions = new Set<string>();
export const cancelledThreads = new Set<string>();

export function markRunCancelled(sessionId?: string | null, threadId?: string | null): void {
  if (sessionId) cancelledSessions.add(sessionId);
  if (threadId) cancelledThreads.add(threadId);
}

export function clearRunCancelled(sessionId?: string | null, threadId?: string | null): void {
  if (sessionId) cancelledSessions.delete(sessionId);
  if (threadId) cancelledThreads.delete(threadId);
}

export function clearAllCancelled(): void {
  cancelledSessions.clear();
  cancelledThreads.clear();
}

export function isRunCancelled(sessionId?: string | null, threadId?: string | null): boolean {
  return Boolean(
    (sessionId && cancelledSessions.has(sessionId)) || (threadId && cancelledThreads.has(threadId))
  );
}

export function createCancelReasoningStep(detail?: string | null): ReasoningStep {
  return {
    id: `cancel-${Date.now()}`,
    type: 'message',
    content: detail
      ? `Analysis stopped locally, but the server reported an issue (${detail}). Reload if it reappears.`
      : 'Analysis cancelled by user.',
    timestamp: Date.now(),
  };
}
