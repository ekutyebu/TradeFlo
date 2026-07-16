'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import StatCard from '@/components/ui/StatCard';
import EquityCurve from '@/components/ui/EquityCurve';
import TradeTable from '@/components/ui/TradeTable';
import { api, type Account, type AnalyticsSummary, type EquityPoint, type Trade, type RiskAlert } from '@/lib/api';
import { AlertTriangle, AlertCircle, Info, TrendingUp, Target, Shield, Zap } from 'lucide-react';
import clsx from 'clsx';

import Link from 'next/link';

export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [equityPoints, setEquityPoints] = useState<EquityPoint[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const accounts = await api.accounts.list();
        if (!accounts.length) { setLoading(false); return; }
        const acc = accounts[0];
        setAccount(acc);

        const [analyticsData, curveData, tradesData, alertsData] = await Promise.all([
          api.analytics.summary(acc.id).catch(() => null),
          api.analytics.equityCurve(acc.id).catch(() => null),
          api.trades.list({ account_id: acc.id, limit: 10 }).catch(() => []),
          api.analytics.riskAlerts(acc.id).catch(() => ({ alerts: [] })),
        ]);

        if (analyticsData) setAnalytics(analyticsData);
        if (curveData) setEquityPoints(curveData.points);
        setRecentTrades(tradesData);
        setAlerts(alertsData.alerts);
      } catch (e) {
        console.warn("Could not load dashboard data. Check if backend is running:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const todayTrades = recentTrades.filter((t) => {
    const d = new Date(t.entry_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayPnl = todayTrades.reduce((s, t) => s + (t.pnl || 0), 0);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="flex gap-2">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!account) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-dim border border-primary/20 flex items-center justify-center">
            <TrendingUp size={28} className="text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary">Welcome to TradeFlo</h2>
            <p className="text-text-muted text-sm mt-1 max-w-sm">
              Create your first trading account to start journaling and tracking your performance.
            </p>
          </div>
          <Link href="/settings">
            <button className="btn-primary">
              <Zap size={14} />
              Create Account
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const score = analytics?.edge_score ?? 0;
  let scoreStatus = { label: 'No Data', desc: 'Log trades to calculate your Edge Score.', color: 'text-text-muted' };
  if (analytics && analytics.total_trades > 0) {
    if (score >= 80) {
      scoreStatus = { label: 'Elite Trader', desc: 'Exemplary risk adherence, high consistency.', color: 'text-primary' };
    } else if (score >= 60) {
      scoreStatus = { label: 'Disciplined', desc: 'Solid consistency. Keep executing details.', color: 'text-primary' };
    } else if (score >= 40) {
      scoreStatus = { label: 'Average Edge', desc: 'Maintain strict risk limits. Watch drawdowns.', color: 'text-amber-400' };
    } else {
      scoreStatus = { label: 'Tilted / Risky', desc: 'Revenge danger! Visit Sanctuary to reset.', color: 'text-red-400' };
    }
  }

  return (
    <AppShell
      accountName={account.name}
      balance={account.current_balance}
      currency={account.currency}
      todayPnl={todayPnl}
    >
      <div className="space-y-6">
        {/* Risk Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={clsx(
                  'flex items-start gap-3 px-4 py-3 rounded-lg border text-sm',
                  alert.level === 'CRITICAL' && 'alert-critical border',
                  alert.level === 'WARNING' && 'alert-warning border',
                  alert.level === 'INFO' && 'alert-info border',
                )}
              >
                {alert.level === 'CRITICAL' && <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />}
                {alert.level === 'WARNING' && <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                {alert.level === 'INFO' && <Info size={14} className="mt-0.5 flex-shrink-0" />}
                <span>{alert.message}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Dashboard Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
          {/* Left Column: Stats Grid */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* First Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <StatCard
                label="Win Rate"
                value={analytics ? `${(analytics.win_rate * 100).toFixed(1)}%` : '—'}
                subtext={analytics ? `${analytics.total_trades} trades` : 'No data'}
                trend={analytics && analytics.win_rate > 0.5 ? 'up' : analytics && analytics.win_rate > 0 ? 'down' : 'neutral'}
                highlight={!!(analytics && analytics.win_rate > 0.5)}
                delay={0}
              />
              <StatCard
                label="Profit Factor"
                value={analytics ? analytics.profit_factor === Infinity ? '∞' : analytics.profit_factor.toFixed(2) : '—'}
                subtext="gross profit / loss"
                valueColor={analytics && analytics.profit_factor >= 1.5 ? 'primary' : analytics && analytics.profit_factor < 1 ? 'red' : 'default'}
                delay={0.05}
              />
              <StatCard
                label="Expected Value"
                value={analytics ? `${analytics.expected_value >= 0 ? '+' : ''}${analytics.expected_value.toFixed(2)}` : '—'}
                suffix={account.currency}
                valueColor={analytics && analytics.expected_value > 0 ? 'primary' : 'red'}
                subtext="per trade"
                delay={0.1}
              />
              <StatCard
                label="Max Drawdown"
                value={analytics ? `${analytics.max_drawdown_pct.toFixed(1)}%` : '—'}
                valueColor={analytics && analytics.max_drawdown_pct > account.max_drawdown_pct ? 'red' : analytics && analytics.max_drawdown_pct > account.max_drawdown_pct * 0.75 ? 'amber' : 'default'}
                subtext={`Limit: ${account.max_drawdown_pct}%`}
                delay={0.15}
              />
            </div>

            {/* Second Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <StatCard label="Total P&L" value={analytics ? `${analytics.total_pnl >= 0 ? '+' : ''}${analytics.total_pnl.toFixed(2)}` : '—'}
                suffix={account.currency} valueColor={analytics && analytics.total_pnl >= 0 ? 'primary' : 'red'} delay={0.2} />
              <StatCard label="Avg R:R" value={analytics ? `${analytics.avg_rr.toFixed(2)}R` : '—'}
                subtext="realized" delay={0.25} />
              <StatCard label="Win Streak" value={analytics?.longest_win_streak ?? '—'}
                subtext="longest" delay={0.3} />
              <StatCard label="Best Symbol" value={analytics?.best_symbol ?? '—'}
                subtext={analytics?.best_session ? `${analytics.best_session} session` : undefined} delay={0.35} />
            </div>
          </div>

          {/* Right Column: Edge Score Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-1 glass-card p-5 flex flex-col items-center justify-center text-center border-primary/20 bg-gradient-radial from-primary/5 to-transparent h-full min-h-[220px]"
            style={{ boxShadow: '0 0 24px rgba(16,185,129,0.06)' }}
          >
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Edge Rating</span>
            
            {/* SVG Circle */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="#1E2028"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke={score >= 60 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={289.0}
                  strokeDashoffset={289.0 - (289.0 * score) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 6px ${score >= 60 ? 'rgba(16,185,129,0.4)' : score >= 40 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'})` }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-text-primary tracking-tighter">
                  {score.toFixed(0)}
                </span>
                <span className="text-[10px] text-text-muted block font-semibold">SCORE</span>
              </div>
            </div>

            <div className="mt-4">
              <span className={`text-xs font-black uppercase tracking-widest ${scoreStatus.color}`}>
                {scoreStatus.label}
              </span>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-[160px] mx-auto">
                {scoreStatus.desc}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Equity Curve */}
        <EquityCurve
          data={equityPoints}
          initialBalance={account.initial_balance}
          currency={account.currency}
        />

        {/* Recent Trades */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Recent Trades</h2>
            <a href="/journal" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          <TradeTable trades={recentTrades} currency={account.currency} compact />
        </div>
      </div>
    </AppShell>
  );
}
