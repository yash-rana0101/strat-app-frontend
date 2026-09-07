// components/quant/useFqHeartbeat.ts
//
// Dedicated hooks for selecting heartbeat telemetry and Best Current Read data,
// decoupled from useFqSession.ts to strictly maintain file line limits (< 250 lines).

import { FQ_MULTI_SESSION } from '../../lib/env';
import { useQuantStore, type BestCurrentRead } from '../../store/useQuantStore';
import { useSessionStore } from '../../store/useSessionStore';
import {
  selectBestCurrentRead,
  selectHeartbeatCount,
  selectLastHeartbeatAt,
  selectLastHeartbeatStatus,
} from '../../store/sessionSelectors';

export interface FqHeartbeatInfo {
  heartbeatCount: number;
  lastHeartbeatAt: number | null;
  lastHeartbeatStatus: string | null;
}

/** Returns the latest interim best_current_read assessment for the active session. */
export function useFqBestCurrentRead(): BestCurrentRead | null {
  const next = useSessionStore(selectBestCurrentRead);
  const legacy = useQuantStore((s) => s.bestCurrentRead);
  return FQ_MULTI_SESSION ? next : legacy;
}

/** Returns background watcher heartbeat telemetry for the active session. */
export function useFqHeartbeatInfo(): FqHeartbeatInfo {
  const nextCount = useSessionStore(selectHeartbeatCount);
  const nextLastAt = useSessionStore(selectLastHeartbeatAt);
  const nextStatus = useSessionStore(selectLastHeartbeatStatus);

  const legacyCount = useQuantStore((s) => s.heartbeatCount);
  const legacyLastAt = useQuantStore((s) => s.lastHeartbeatAt);
  const legacyStatus = useQuantStore((s) => s.lastHeartbeatStatus);

  if (FQ_MULTI_SESSION) {
    return {
      heartbeatCount: nextCount,
      lastHeartbeatAt: nextLastAt,
      lastHeartbeatStatus: nextStatus,
    };
  }

  return {
    heartbeatCount: legacyCount ?? 0,
    lastHeartbeatAt: legacyLastAt ?? null,
    lastHeartbeatStatus: legacyStatus ?? null,
  };
}

