'use client';

// components/quant/session/SessionHistoryControls.tsx
//
// Presentational header controls for SessionHistory: status filter tabs (Closed/Active),
// server-side search input, and action error banner. Extracted to keep SessionHistory
// focused on orchestration and well under the 300-line architecture limit.

import React from 'react';
import { AlertTriangle, Loader2, Search } from 'lucide-react';

export interface SessionHistoryControlsProps {
  showStatusFilter?: boolean;
  controlledStatus?: 'active' | 'archived';
  status: 'active' | 'archived';
  onStatusChange: (status: 'active' | 'archived') => void;
  everPaged: boolean;
  rawQuery: string;
  onQueryChange: (q: string) => void;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  actionError: string | null;
  onDismissError: () => void;
}

export default function SessionHistoryControls({
  showStatusFilter = true,
  controlledStatus,
  status,
  onStatusChange,
  everPaged,
  rawQuery,
  onQueryChange,
  isFetching,
  isFetchingNextPage,
  actionError,
  onDismissError,
}: SessionHistoryControlsProps) {
  return (
    <>
      {showStatusFilter && !controlledStatus && (
        <div className="flex shrink-0 border-b border-border-default/40 bg-surface/50 text-xs">
          <button
            type="button"
            role="tab"
            aria-selected={status === 'archived'}
            onClick={() => onStatusChange('archived')}
            className={`flex-1 py-1.5 text-center font-medium transition-colors ${
              status === 'archived'
                ? 'border-b-2 border-primary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Closed
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={status === 'active'}
            onClick={() => onStatusChange('active')}
            className={`flex-1 py-1.5 text-center font-medium transition-colors ${
              status === 'active'
                ? 'border-b-2 border-primary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Active
          </button>
        </div>
      )}

      {everPaged && (
        <div className="shrink-0 border-b border-border-default/40 p-2">
          <div className="flex items-center gap-1.5 rounded border border-border-default/60 bg-surface px-2">
            <Search size={12} className="shrink-0 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              value={rawQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search sessions"
              aria-label="Search sessions"
              className="w-full bg-transparent py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            {isFetching && !isFetchingNextPage && (
              <Loader2
                size={11}
                className="shrink-0 animate-spin text-text-muted"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex shrink-0 items-start gap-1.5 border-b border-border-default/40 bg-elevated p-2 text-xs text-text-secondary"
        >
          <AlertTriangle
            size={12}
            className="mt-0.5 shrink-0 text-status-error"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">{actionError}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismissError}
            className="shrink-0 text-text-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/60"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
