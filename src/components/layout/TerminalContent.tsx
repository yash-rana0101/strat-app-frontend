'use client';

import React from 'react';
import type { TradeProfile } from '../../store/useTradeStore';
import { useMobileNavStore } from '../../store/useMobileNavStore';
import MobileChartHeader from '../mobile/MobileChartHeader';
import MobileWatchlistView from '../mobile/MobileWatchlistView';
import MobileAgentView from '../mobile/MobileAgentView';
import MobileOrderBookView from '../mobile/MobileOrderBookView';
import MobileProfileView from '../mobile/MobileProfileView';
import LeftPanel from '../panels/LeftPanel';
import DeepQuantPanel from '../quant/DeepQuantPanel';

interface TerminalContentProps {
  renderProfileContent: () => React.ReactNode;
  activeProfile: TradeProfile;
  isFullscreen: boolean;
}

/**
 * Responsive terminal central content container.
 * - Desktop: Always renders the chart/profile workspace in the central column.
 * - Mobile: Toggles between Chart, Watchlist, AI Agent, Order Book, and Profile
 *   based on the bottom navigation tab, without tearing down the chart iframe.
 */
export default function TerminalContent({
  renderProfileContent,
  activeProfile,
  isFullscreen,
}: TerminalContentProps) {
  const activeMobileView = useMobileNavStore((s) => s.activeView);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-150 flex flex-col bg-background p-2'
          : 'relative flex h-full min-h-0 min-w-0 flex-col rounded-none bg-surface'
      }
    >
      {/* ── Chart view (always mounted; hidden only on mobile when another tab is active) ── */}
      <div
        className={`h-full w-full flex-col ${activeMobileView === 'chart' ? 'flex' : 'hidden'
          } md:flex flex-1 min-h-0 overflow-hidden`}
      >
        <MobileChartHeader />
        <div className="flex flex-1 h-full min-h-0 w-full overflow-hidden">
          <div className="min-h-0 flex-1 h-full w-full bg-surface relative flex flex-col p-0 overflow-hidden">
            {renderProfileContent()}
          </div>
        </div>
      </div>

      {/* ── Mobile Watchlist view ── */}
      <div
        className={`h-full w-full flex-col ${activeMobileView === 'watchlist' ? 'flex' : 'hidden'
          } md:hidden`}
      >
        <MobileWatchlistView>
          <LeftPanel />
        </MobileWatchlistView>
      </div>

      {/* ── Mobile AI Agent view ── */}
      <div
        className={`h-full w-full flex-col ${activeMobileView === 'agent' ? 'flex' : 'hidden'
          } md:hidden`}
      >
        <MobileAgentView>
          <DeepQuantPanel />
        </MobileAgentView>
      </div>

      {/* ── Mobile Order Book / Confluence view ── */}
      <div
        className={`h-full w-full flex-col ${activeMobileView === 'orderbook' ? 'flex' : 'hidden'
          } md:hidden`}
      >
        <MobileOrderBookView activeProfile={activeProfile} />
      </div>

      {/* ── Mobile Profile / Settings view ── */}
      <div
        className={`h-full w-full flex-col ${activeMobileView === 'profile' ? 'flex' : 'hidden'
          } md:hidden`}
      >
        <MobileProfileView />
      </div>
    </div>
  );
}

