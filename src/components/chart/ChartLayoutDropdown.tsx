import React from 'react';
import type { ChartLayoutId, LayoutSyncSettings } from '../../types/chartLayout';
import { LAYOUT_ROWS, getLayoutsForRow } from './layoutCatalog';
import { LayoutIcon } from './LayoutIcon';
import { SyncToggles } from './SyncToggles';

interface ChartLayoutDropdownProps {
  activeLayout: ChartLayoutId;
  syncSettings: LayoutSyncSettings;
  onSelectLayout: (layoutId: ChartLayoutId) => void;
  onToggleSync: (key: keyof LayoutSyncSettings, enabled: boolean) => void;
  className?: string;
}

export const ChartLayoutDropdown: React.FC<ChartLayoutDropdownProps> = ({
  activeLayout,
  syncSettings,
  onSelectLayout,
  onToggleSync,
  className = '',
}) => {
  return (
    <div
      role="dialog"
      aria-label="Chart layouts and synchronization"
      className={`w-[330px] rounded-lg border border-border-default bg-surface/98 p-3 shadow-2xl backdrop-blur-xl transition-all ${className}`}
    >
      {/* 1-8 Pane Layout Rows */}
      <div className="space-y-1.5">
        {LAYOUT_ROWS.map((row, idx) => {
          const layouts = getLayoutsForRow(row);
          if (layouts.length === 0) return null;

          return (
            <React.Fragment key={row}>
              {idx > 0 && <div className="border-b border-border-default/40 my-1" />}
              <div className="flex items-center gap-2">
                <span className="w-4 text-center text-[12px] font-medium text-text-muted shrink-0 select-none">
                  {row}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {layouts.map((layout) => {
                    const isSelected = layout.id === activeLayout;
                    // Provide test ids for legacy single/split tests
                    const testId =
                      layout.id === '1'
                        ? 'split-view-single'
                        : layout.id === '2v'
                        ? 'split-view-split'
                        : `split-view-${layout.id}`;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        id={testId}
                        aria-pressed={isSelected}
                        title={layout.name}
                        onClick={() => onSelectLayout(layout.id)}
                        className={`group flex h-7 w-7 items-center justify-center rounded transition-all duration-150 ${
                          isSelected
                            ? 'bg-slate-800 text-white dark:bg-slate-700 ring-1 ring-slate-600 shadow-sm'
                            : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
                        }`}
                      >
                        <LayoutIcon
                          id={layout.id}
                          size={24}
                          className={
                            isSelected
                              ? 'text-white'
                              : 'text-text-secondary group-hover:text-text-primary'
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Sync in Layout section */}
      <SyncToggles sync={syncSettings} onToggle={onToggleSync} />
    </div>
  );
};

export default ChartLayoutDropdown;
