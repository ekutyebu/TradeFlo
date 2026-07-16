'use client';

import { motion } from 'framer-motion';
import { Bell, RefreshCw, ChevronDown, Circle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':  { title: 'Dashboard',       subtitle: 'Your trading overview' },
  '/chart':      { title: 'Chart',           subtitle: 'TradingView Advanced Charts' },
  '/trade':      { title: 'Trade Execution', subtitle: 'Live execution panel' },
  '/journal':    { title: 'Trade Journal',   subtitle: 'Log and review your trades' },
  '/backtest':  { title: 'Backtesting',     subtitle: 'Test strategies on historical data' },
  '/notebook':  { title: 'Notebook',        subtitle: 'Strategies, checklists and reviews' },
  '/sanctuary':  { title: 'Sanctuary',       subtitle: 'Trading psychology and mindfulness' },
  '/academy':    { title: 'Academy',         subtitle: 'Smart Money Concepts & Education' },
  '/ai-coach':   { title: 'AI Coach',        subtitle: 'Powered by TradeFlo intelligence' },
  '/settings':   { title: 'Settings',        subtitle: 'Configure your workspace' },
};

interface TopBarProps {
  accountName?: string;
  balance?: number;
  currency?: string;
  todayPnl?: number;
}

export default function TopBar({
  accountName = 'My Account',
  balance = 0,
  currency = 'USD',
  todayPnl = 0,
}: TopBarProps) {
  const pathname = usePathname();
  const page = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key));
  const { title, subtitle } = page?.[1] || { title: 'TradeFlo', subtitle: '' };

  const pnlPositive = todayPnl >= 0;

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="h-14 flex items-center justify-between px-6"
      style={{
        background: 'rgba(13,14,18,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1E2028',
      }}
    >
      {/* Left: Page title */}
      <div>
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>

      {/* Right: Account info + actions */}
      <div className="flex items-center gap-3">
        {/* Today P&L ticker */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-bg-border">
          <Circle size={6} className={pnlPositive ? 'text-primary fill-primary' : 'text-red-400 fill-red-400'} />
          <span className="text-xs text-text-muted">Today</span>
          <span className={`text-xs font-semibold tabular-nums ${pnlPositive ? 'text-primary' : 'text-red-400'}`}>
            {pnlPositive ? '+' : ''}{todayPnl.toFixed(2)} {currency}
          </span>
        </div>

        {/* Balance */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-bg-border">
          <span className="text-xs text-text-muted">Balance</span>
          <span className="text-xs font-semibold text-text-primary tabular-nums">
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
          </span>
        </div>

        {/* Refresh */}
        <button className="btn-ghost !px-2 !py-2" title="Refresh data">
          <RefreshCw size={14} />
        </button>

        {/* Notifications */}
        <button className="relative btn-ghost !px-2 !py-2" title="Alerts">
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* Account selector */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-bg-border hover:bg-bg-hover transition-colors">
          <div className="w-6 h-6 rounded-full bg-primary-dim border border-primary/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">
              {accountName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-medium text-text-primary max-w-[100px] truncate">
            {accountName}
          </span>
          <ChevronDown size={12} className="text-text-muted" />
        </button>
      </div>
    </motion.header>
  );
}
