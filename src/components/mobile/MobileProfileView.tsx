'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, HelpCircle, Zap, TrendingUp, Landmark, Layers } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTradeStore, type TradeProfile } from '../../store/useTradeStore';
import { useBillingHistory, useCredit } from '../../hooks/useApi';
import { PROFILES, getInitials } from '../../utils/layoutHelpers';
import ProfileTab from '../profile/tabs/ProfileTab';
import SubscriptionTab from '../profile/tabs/SubscriptionTab';
import BillingTab from '../profile/tabs/BillingTab';
import { REPLAY_TOUR_EVENT } from '../layout/QuickStartGuide';

type ProfileSection = 'workspace' | 'account' | 'subscription' | 'billing';

const PROFILE_ICONS: Record<TradeProfile, React.ElementType> = {
  INTRADAY: Zap,
  SWING: TrendingUp,
  INVESTOR: Landmark,
  FNO: Layers,
};

export default function MobileProfileView() {
  const { user, logout, fetchProfile } = useAuthStore();
  const { activeProfile, setActiveProfile } = useTradeStore();
  const [activeSection, setActiveSection] = useState<ProfileSection>('workspace');

  const {
    data: creditData,
    loading: creditLoading,
    error: creditError,
    refetch: refetchCredit,
  } = useCredit();

  const {
    data: billingData,
    loading: billingLoading,
    error: billingError,
    refetch: refetchBilling,
  } = useBillingHistory();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const planName =
    creditData?.planName && creditData.planName !== 'none' ? creditData.planName : null;

  const formatDate = (timestamp: string | number) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(timestamp);
    }
  };

  return (
    <div data-tour="mobile-profile-view" className="flex h-full flex-col bg-surface overflow-hidden">
      {/* Header with user info */}
      <div className="flex items-center justify-between border-b border-border-default/40 p-3 bg-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-text-primary truncate">{user?.name || 'User'}</h2>
            <p className="text-[9px] text-text-secondary">
              {planName ? `${planName} Plan` : 'Free Tier'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            data-tour="mobile-replay-tour"
            type="button"
            onClick={() => window.dispatchEvent(new Event(REPLAY_TOUR_EVENT))}
            className="flex items-center gap-1 rounded border border-border-default/60 px-2 py-1 text-[10px] font-semibold text-text-secondary hover:bg-elevated hover:text-text-primary cursor-pointer"
          >
            <HelpCircle size={12} />
            <span>Replay tour</span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-1 rounded border border-border-default/60 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/10 cursor-pointer"
          >
            <LogOut size={12} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex border-b border-border-default/40 bg-surface/50 text-[11px] overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSection('workspace')}
          className={`flex flex-1 items-center justify-center py-2 font-medium transition-colors border-b-2 whitespace-nowrap px-2 cursor-pointer ${activeSection === 'workspace'
            ? 'border-emerald-500 text-emerald-400 font-semibold'
            : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
        >
          Trading Mode
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('account')}
          className={`flex flex-1 items-center justify-center py-2 font-medium transition-colors border-b-2 whitespace-nowrap px-2 cursor-pointer ${activeSection === 'account'
            ? 'border-emerald-500 text-emerald-400 font-semibold'
            : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('subscription')}
          className={`flex flex-1 items-center justify-center py-2 font-medium transition-colors border-b-2 whitespace-nowrap px-2 cursor-pointer ${activeSection === 'subscription'
            ? 'border-emerald-500 text-emerald-400 font-semibold'
            : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
        >
          Credits
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('billing')}
          className={`flex flex-1 items-center justify-center py-2 font-medium transition-colors border-b-2 whitespace-nowrap px-2 cursor-pointer ${activeSection === 'billing'
            ? 'border-emerald-500 text-emerald-400 font-semibold'
            : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
        >
          Billing
        </button>
      </div>

      {/* Content body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-none">
        {activeSection === 'workspace' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Select Active Trading Mode
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {PROFILES.map(({ key, label, shortcut }) => {
                const isCurrent = activeProfile === key;
                const IconComponent = PROFILE_ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveProfile(key)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all cursor-pointer ${isCurrent
                      ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-400 shadow-sm'
                      : 'border-border-default/60 bg-elevated/40 text-text-primary hover:border-border-default'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent size={16} />
                      <span className="text-xs font-bold">{label}</span>
                    </div>
                    <span className="text-[9.5px] text-text-muted">{shortcut}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === 'account' && (
          <ProfileTab user={user} planName={planName} formatDate={formatDate} />
        )}

        {activeSection === 'subscription' && (
          <SubscriptionTab
            credit={creditData}
            loading={creditLoading}
            error={creditError}
            refetch={refetchCredit}
          />
        )}

        {activeSection === 'billing' && (
          <BillingTab
            history={billingData}
            loading={billingLoading}
            error={billingError}
            refetch={refetchBilling}
          />
        )}
      </div>
    </div>
  );
}

