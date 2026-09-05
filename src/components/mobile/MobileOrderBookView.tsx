'use client';

import React from 'react';
import type { TradeProfile } from '../../store/useTradeStore';
import OrderBook from '../OrderBook';
import SwingConfluencePanel from '../layouts/swing/SwingConfluencePanel';
import { MacroSentimentPanel } from '../layouts/MacroSentimentPanel';
import FnoSidebarPanel from '../fno/FnoSidebarPanel';

interface MobileOrderBookViewProps {
  activeProfile: TradeProfile;
}

/**
 * Full-screen mobile view for the order book and profile-specific intelligence panels.
 * Adapts to active workspace profile (Intraday Order Book, Swing Confluence,
 * Macro Sentiment, or F&O Greeks/Strikes).
 */
export default function MobileOrderBookView({ activeProfile }: MobileOrderBookViewProps) {
  const renderContent = () => {
    switch (activeProfile) {
      case 'INTRADAY':
        return <OrderBook />;
      case 'SWING':
        return <SwingConfluencePanel />;
      case 'INVESTOR':
        return <MacroSentimentPanel />;
      case 'FNO':
        return <FnoSidebarPanel />;
      default:
        return <OrderBook />;
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-default/40 px-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
          {activeProfile === 'INTRADAY' ? 'Order Book & Depth' : `${activeProfile} Intelligence`}
        </span>
        <span className="rounded-sm border border-border-default bg-elevated px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-text-secondary">
          {activeProfile}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
        {renderContent()}
      </div>
    </div>
  );
}

