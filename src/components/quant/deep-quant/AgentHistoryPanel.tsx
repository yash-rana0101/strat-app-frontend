'use client';

// components/quant/deep-quant/AgentHistoryPanel.tsx
//
// The right-side slide-in history panel for Agent Mode (DeepQuantAgentDialog).
// Provides full session management: browse active & closed sessions, search,
// rename, archive/reopen, delete, and switch active session with instant rehydration.

import React from 'react';
import { AlertTriangle, History, X } from 'lucide-react';
import { FqQueryProvider } from '../../../lib/fq/FqQueryProvider';
import { useActivateSession } from '../../../lib/fq/useActivateSession';
import SessionHistory from '../session/SessionHistory';

export interface AgentHistoryPanelProps {
  onClose: () => void;
  onSessionSelect?: (sessionId: string) => void;
}

function AgentHistoryPanelContent({ onClose, onSessionSelect }: AgentHistoryPanelProps) {
  const activate = useActivateSession();
  const [openError, setOpenError] = React.useState<string | null>(null);

  const handleOpen = React.useCallback(
    async (sessionId: string) => {
      setOpenError(null);
      const result = await activate(sessionId);
      if (result.ok) {
        onSessionSelect?.(sessionId);
        return;
      }
      setOpenError(
        result.error?.notFound
          ? 'That session no longer exists. It may have been deleted.'
          : result.error?.unauthenticated
            ? 'Your session expired. Sign in again to open it.'
            : (result.error?.message ?? 'Could not open this session.'),
      );
    },
    [activate, onSessionSelect],
  );

  return (
    <aside
      aria-label="Session history panel"
      className="absolute right-0 top-0 bottom-0 z-30 flex w-full flex-col border-l border-border-default bg-surface shadow-2xl transition-all duration-200 sm:w-[340px]"
    >
      {/* ── Panel Header ─────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-default px-3.5 py-2.5 bg-elevated/20">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-primary">
          <History size={13} className="text-primary shrink-0" aria-hidden="true" />
          <span>Session History</span>
        </div>
        <button
          type="button"
          aria-label="Close history panel"
          title="Close history"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-elevated hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────── */}
      {openError && (
        <div
          role="alert"
          className="flex items-start gap-1.5 border-b border-border-default/40 bg-elevated p-2 text-xs text-text-secondary"
        >
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-status-error" aria-hidden="true" />
          <span className="min-w-0 flex-1">{openError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setOpenError(null)}
            className="shrink-0 text-text-muted hover:text-text-primary focus:outline-none"
          >
            ×
          </button>
        </div>
      )}

      {/* ── History List (Active & Closed, with Rename, Archive & Delete) ── */}
      <div className="min-h-0 flex-1">
        <SessionHistory
          onOpen={(id) => void handleOpen(id)}
          defaultStatus="active"
          showStatusFilter={true}
        />
      </div>
    </aside>
  );
}

export default function AgentHistoryPanel(props: AgentHistoryPanelProps) {
  return (
    <FqQueryProvider>
      <AgentHistoryPanelContent {...props} />
    </FqQueryProvider>
  );
}

