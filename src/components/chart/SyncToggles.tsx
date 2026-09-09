import React from 'react';
import { Info } from 'lucide-react';
import type { LayoutSyncSettings } from '../../types/chartLayout';

interface SyncTogglesProps {
  sync: LayoutSyncSettings;
  onToggle: (key: keyof LayoutSyncSettings, enabled: boolean) => void;
}

interface SyncItemSpec {
  key: keyof LayoutSyncSettings;
  label: string;
  tooltip: string;
}

const SYNC_ITEMS: SyncItemSpec[] = [
  { key: 'symbol', label: 'Symbol', tooltip: 'Sync symbol across all charts' },
  { key: 'interval', label: 'Interval', tooltip: 'Sync timeframe across all charts' },
  { key: 'crosshair', label: 'Crosshair', tooltip: 'Sync crosshair cursor across all charts' },
  { key: 'time', label: 'Time', tooltip: 'Sync time scroll and zoom across all charts' },
  { key: 'dateRange', label: 'Date range', tooltip: 'Sync visible date range across all charts' },
];

export const SyncToggles: React.FC<SyncTogglesProps> = ({ sync, onToggle }) => {
  return (
    <div className="mt-3 border-t border-border-default/60 pt-3">
      <div className="mb-2 px-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
        SYNC IN LAYOUT
      </div>
      <div className="space-y-1.5">
        {SYNC_ITEMS.map(({ key, label, tooltip }) => {
          const isChecked = sync[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between px-1 py-1 text-[13px] text-text-primary hover:bg-elevated/40 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-normal">{label}</span>
                <span title={tooltip} className="inline-flex items-center cursor-help">
                  <Info size={13} className="text-text-muted/70 hover:text-text-primary transition-colors" />
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                onClick={() => onToggle(key, !isChecked)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isChecked ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isChecked ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
