'use client';

// components/quant/session/SessionHistory.tsx
//
// Session history: a cursor-paginated list of the user's sessions.
// The hard constraint is that this must NEVER load the whole history into the browser.
// Paging and filtering are both the server's job (?cursor=, ?q=).

import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

import {
  useDeleteSession,
  useRenameSession,
  useReopenSession,
  useSessions,
} from '../../../lib/fq/queries';
import { useSessionStore } from '../../../store/useSessionStore';
import SessionHistoryControls from './SessionHistoryControls';
import SessionHistoryRow from './SessionHistoryRow';

export interface SessionHistoryProps {
  /** Opening a session must also rehydrate it, so the caller supplies the activation. */
  onOpen: (sessionId: string) => void;
  /** Filter sessions: 'all' by default to load the complete history, or specific status */
  status?: 'active' | 'archived' | 'all';
  /** @deprecated Kept for backwards compatibility */
  defaultStatus?: 'active' | 'archived' | 'all';
  /** @deprecated Kept for backwards compatibility */
  showStatusFilter?: boolean;
}

const SEARCH_MIN_PAGES = 1;
const SEARCH_DEBOUNCE_MS = 250;

export default function SessionHistory({
  onOpen,
  status: controlledStatus,
  defaultStatus,
}: SessionHistoryProps) {
  const [rawQuery, setRawQuery] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [openingId, setOpeningId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const status = controlledStatus ?? defaultStatus ?? 'all';

  React.useEffect(() => {
    const id = setTimeout(() => setQuery(rawQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [rawQuery]);

  const list = useSessions({ status, q: query || undefined });
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activatingSessionIds = useSessionStore((s) => s.activatingSessionIds);
  const rename = useRenameSession();
  const reopen = useReopenSession();
  const deleteSession = useDeleteSession();

  const sessions = React.useMemo(
    () => (list.data?.pages ?? []).flatMap((page) => page.items),
    [list.data]
  );

  const [everPaged, setEverPaged] = React.useState(false);
  React.useEffect(() => {
    if ((list.data?.pages.length ?? 0) > SEARCH_MIN_PAGES || list.hasNextPage) setEverPaged(true);
  }, [list.data, list.hasNextPage]);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && list.hasNextPage && !list.isFetchingNextPage) {
        void list.fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [list.hasNextPage, list.isFetchingNextPage, list.fetchNextPage]);

  /** Run a row mutation, surfacing failure instead of letting the rejection escape. */
  const run = async (sessionId: string, verb: string, op: () => Promise<unknown>) => {
    setBusyId(sessionId);
    setActionError(null);
    try {
      await op();
    } catch (err) {
      setActionError(
        err instanceof Error && err.message
          ? `Could not ${verb}: ${err.message}`
          : `Could not ${verb}.`
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRename = (sessionId: string, title: string | null) =>
    void run(sessionId, 'rename this session', () => rename.mutateAsync({ sessionId, title }));

  const handleOpenRow = async (sessionId: string) => {
    setOpeningId(sessionId);
    try {
      await onOpen(sessionId);
    } finally {
      setOpeningId(null);
    }
  };

  const handleReopen = (sessionId: string) =>
    void run(sessionId, 'reopen this session', async () => {
      await reopen.mutateAsync(sessionId);
      onOpen(sessionId);
      await handleOpenRow(sessionId);
    });

  const handleDelete = (sessionId: string) =>
    void run(sessionId, 'delete this session', async () => {
      await deleteSession.mutateAsync({ sessionId });
      if (useSessionStore.getState().activeSessionId === sessionId) {
        useSessionStore.getState().setActiveSession(null);
      }
      useSessionStore.getState().dropSession(sessionId);
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SessionHistoryControls
        everPaged={everPaged}
        rawQuery={rawQuery}
        onQueryChange={setRawQuery}
        isFetching={list.isFetching}
        isFetchingNextPage={list.isFetchingNextPage}
        actionError={actionError}
        onDismissError={() => setActionError(null)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.isLoading ? (
          <div className="p-2" role="status" aria-live="polite">
            <span className="sr-only">Loading session history…</span>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="mb-2 h-8 animate-pulse rounded bg-elevated"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : list.isError ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 p-3 text-xs text-text-secondary"
          >
            <span className="flex items-start gap-1.5">
              <AlertTriangle
                size={13}
                className="mt-0.5 shrink-0 text-status-error"
                aria-hidden="true"
              />
              <span>
                Could not load your history
                {list.error instanceof Error && list.error.message ? `: ${list.error.message}` : ''}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void list.refetch()}
              disabled={list.isFetching}
              className="flex items-center gap-1 rounded border border-border-default/60 px-2 py-0.5 hover:bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60 disabled:opacity-50"
            >
              <RefreshCw
                size={11}
                className={list.isFetching ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              Retry
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="p-3 text-xs text-text-muted">
            {query
              ? `No sessions match “${query}”.`
              : status === 'archived'
                ? 'Nothing archived yet.'
                : status === 'active'
                  ? 'No active sessions yet.'
                  : 'No sessions in history yet.'}
          </p>
        ) : (
          <>
            <ul aria-label="Session history">
              {sessions.map((session) => (
                <SessionHistoryRow
                  key={session.session_id}
                  session={session}
                  isActive={session.session_id === activeSessionId}
                  isBusy={busyId === session.session_id}
                  isOpening={
                    openingId === session.session_id ||
                    Boolean(activatingSessionIds?.[session.session_id])
                  }
                  onOpen={handleOpenRow}
                  onRename={handleRename}
                  onReopen={handleReopen}
                  onDelete={handleDelete}
                />
              ))}
            </ul>

            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
            {list.hasNextPage && (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => void list.fetchNextPage()}
                  disabled={list.isFetchingNextPage}
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-border-default/60 py-1 text-xs text-text-secondary hover:bg-elevated hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60 disabled:opacity-50"
                >
                  {list.isFetchingNextPage && (
                    <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                  )}
                  {list.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
