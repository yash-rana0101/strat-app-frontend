'use client';

// components/quant/session/SessionHistoryRow.tsx
// One row of session history. Presentational plus its own inline-rename state;
// every mutation is handed upward so the list owns the server interaction.

import React from 'react';
import { Check, Loader2, Pencil, RotateCcw, Trash2, X } from 'lucide-react';

import type { SessionSummary } from '../../../lib/fq/api';
import { formatSessionDay, formatSessionTime, sessionTabLabel } from './sessionLabel';

export interface SessionHistoryRowProps {
  session: SessionSummary;
  isActive: boolean;
  /** A mutation for this row is in flight. */
  isBusy?: boolean;
  /** This session is currently being opened/activated. */
  isOpening?: boolean;
  onOpen: (sessionId: string) => void;
  onRename: (sessionId: string, title: string | null) => void;
  onArchive?: (sessionId: string) => void;
  onReopen: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

export function relativeUpdated(epochSeconds: number, now: number = Date.now()): string {
  if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) return '';
  const seconds = Math.floor((now - epochSeconds * 1000) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${formatSessionDay(epochSeconds)} ${formatSessionTime(epochSeconds)}`;
}

function lastRunSummary(session: SessionSummary): string | null {
  const run = session.last_run;
  if (!run) return null;
  const kind = run.kind === 'verify' ? 'VERIFY' : 'FIND';
  return `${kind} · ${run.status}`;
}

export default function SessionHistoryRow({
  session,
  isActive,
  isBusy = false,
  isOpening = false,
  onOpen,
  onRename,
  onArchive,
  onReopen,
  onDelete,
}: SessionHistoryRowProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const label = sessionTabLabel(session);
  const archived = session.status === 'archived';

  const beginEdit = () => {
    setDraft(session.title ?? '');
    setEditing(true);
    setConfirmDelete(false);
  };

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    const title = next.length > 0 ? next : null;
    if (title === (session.title ?? null)) return;
    onRename(session.session_id, title);
  };

  return (
    <li
      className={`group flex items-center gap-2 border-b border-border-default/30 px-3 py-2 text-xs last:border-b-0 ${
        isActive
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'hover:bg-emerald-500/10'
      }`}
      data-session-id={session.session_id}
    >
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={draft}
              aria-label={`Rename ${label}`}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-full rounded border border-border-default/60 bg-surface px-1.5 py-0.5 text-xs text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60"
            />
            <button
              type="button"
              aria-label="Save name"
              onClick={commit}
              className="shrink-0 rounded p-1 text-text-secondary hover:bg-surface hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60 cursor-pointer"
            >
              <Check size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Cancel rename"
              onClick={() => setEditing(false)}
              className="shrink-0 rounded p-1 text-text-secondary hover:bg-surface hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60 cursor-pointer"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isBusy || isOpening}
            aria-busy={isOpening || undefined}
            onClick={() => (archived ? onReopen(session.session_id) : onOpen(session.session_id))}
            aria-label={archived ? `Open archived ${label}` : `Open ${label}`}
            className="block w-full truncate text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60 cursor-pointer disabled:opacity-60"
          >
            <span
              className={`truncate font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              {label}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
              <span className="truncate">
                {session.symbol} · {session.timeframe}
              </span>
              <span aria-hidden="true">·</span>
              <span className="shrink-0">{relativeUpdated(session.updated_at)}</span>
              {lastRunSummary(session) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0 uppercase">{lastRunSummary(session)}</span>
                </>
              )}
              {archived && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">archived</span>
                </>
              )}
            </span>
          </button>
        )}
      </div>

      {!editing && (
        <div className="flex shrink-0 items-center gap-1">
          {isOpening && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
              <Loader2 size={10} className="animate-spin" aria-hidden="true" />
              <span>Opening…</span>
            </span>
          )}
          {isBusy && !isOpening && (
            <Loader2 size={12} className="animate-spin text-text-muted" aria-hidden="true" />
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={`Confirm delete ${label}`}
                title="Confirm delete"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete?.(session.session_id);
                }}
                className="rounded bg-status-error/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-error hover:bg-status-error/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error/60 cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                aria-label="Cancel delete"
                title="Cancel"
                onClick={() => setConfirmDelete(false)}
                className="rounded p-0.5 text-text-muted hover:text-text-primary focus:outline-none cursor-pointer"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                aria-label={`Rename ${label}`}
                title="Rename"
                onClick={beginEdit}
                className="rounded p-1 text-text-muted opacity-0 transition-opacity hover:bg-surface hover:text-text-primary focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-text-primary/60 group-hover:opacity-100 cursor-pointer"
              >
                <Pencil size={12} aria-hidden="true" />
              </button>
              {archived && (
                <button
                  type="button"
                  aria-label={`Reopen ${label}`}
                  title="Reopen"
                  onClick={() => onReopen(session.session_id)}
                  className="rounded p-1 text-text-muted opacity-0 transition-opacity hover:bg-surface hover:text-text-primary focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-text-primary/60 group-hover:opacity-100 cursor-pointer"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${label}`}
                  title="Delete session"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded p-1 text-text-muted opacity-0 transition-opacity hover:bg-surface hover:text-status-error focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-status-error/60 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}
