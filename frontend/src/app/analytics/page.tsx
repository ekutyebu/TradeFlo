'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import StatCard from '@/components/ui/StatCard';
import EquityCurve from '@/components/ui/EquityCurve';
import { api, type Account, type AnalyticsSummary, type EquityPoint, type PatternInsight } from '@/lib/api';
import { BarChart2, Lightbulb, Calendar, Globe, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function InsightCard({ insight, delay }: { insight: PatternInsight; delay: number }) {
  const categoryIcons: Record<string, React.ReactNode> = {
    timing: <Calendar size={14} />,
    session: <Globe size={14} />,
    instrument: <Target size={14} />,
    discipline: <BarChart2 size={14} />,
    psychology: <Lightbulb size={14} />,
    performance: <TrendingUp size={14} />,
  };

  const categoryColors: Record<string, string> = {
    timing: 'text-primary',
    session: 'text-amber-400',
    instrument: 'text-blue-400',
    discipline: 'text-purple-400',
    psychology: 'text-pink-400',
    performance: 'text-primary',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="glass-card p-4 flex items-start gap-3"
    >
      <div className={`mt-0.5 flex-shrink-0 ${categoryColors[insight.category] || 'text-text-muted'}`}>
        {categoryIcons[insight.category] || <Lightbulb size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {insight.category}
          </span>
          <span className="text-[10px] text-primary bg-primary-dim px-1.5 rounded-full">
            {(insight.confidence * 100).toFixed(0)}% confident
          </span>
        </div>
        <p className="text-xs text-text-primary leading-relaxed">{insight.insight}</p>
      </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [equityPoints, setEquityPoints] = useState<EquityPoint[]>([]);
  const [insights, setInsights] = useState<PatternInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const accounts = await api.accounts.list().catch(() => []);
      if (!accounts.length) { setLoading(false); return; }
      const acc = accounts[0];
      setAccount(acc);

      const [ana, curve, ins] = await Promise.all([
        api.analytics.summary(acc.id).catch(() => null),
        api.analytics.equityCurve(acc.id).catch(() => null),
        api.analytics.insights(acc.id).catch(() => ({ insights: [] })),
      ]);

      if (ana) setAnalytics(ana);
      if (curve) setEquityPoints(curve.points);
      setInsights(ins.insights);
      setLoading(false);
    }
    load();
  }, []);

  // Build breakdown bar charts
  const winLossData = analytics ? [
    { name: 'Wins', value: Math.round(analytics.win_rate * analytics.total_trades), fill: '#10B981' },
    { name: 'Losses', value: Math.round((1 - analytics.win_rate) * analytics.total_trades), fill: '#EF4444' },
  ] : [];

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="space-y-6">
        {/* Core metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Win Rate" value={analytics ? `${(analytics.win_rate * 100).toFixed(1)}%` : '—'} highlight={!!(analytics && analytics.win_rate > 0.5)} delay={0} />
          <StatCard label="Profit Factor" value={analytics ? (analytics.profit_factor === Infinity ? '∞' : analytics.profit_factor.toFixed(2)) : '—'} valueColor={analytics && analytics.profit_factor >= 1.5 ? 'primary' : analytics && analytics.profit_factor < 1 ? 'red' : 'default'} delay={0.05} />
          <StatCard label="Expected Value" value={analytics ? `${analytics.expected_value >= 0 ? '+' : ''}${analytics.expected_value.toFixed(2)}` : '—'} suffix={account?.currency} valueColor={analytics && analytics.expected_value > 0 ? 'primary' : 'red'} delay={0.1} />
          <StatCard label="Max Drawdown" value={analytics ? `${analytics.max_drawdown_pct.toFixed(1)}%` : '—'} delay={0.15} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Trades" value={analytics?.total_trades ?? '—'} delay={0.2} />
          <StatCard label="Avg Win" value={analytics ? `+${analytics.avg_win.toFixed(2)}` : '—'} valueColor="primary" delay={0.25} />
          <StatCard label="Avg Loss" value={analytics ? analytics.avg_loss.toFixed(2) : '—'} valueColor="red" delay={0.3} />
          <StatCard label="Avg R:R" value={analytics ? `${analytics.avg_rr.toFixed(2)}R` : '—'} delay={0.35} />
        </div>

        {/* Second row: streak + timing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Best Trade" value={analytics ? `+${analytics.best_trade_pnl.toFixed(2)}` : '—'} suffix={account?.currency} valueColor="primary" delay={0.4} />
          <StatCard label="Worst Trade" value={analytics ? analytics.worst_trade_pnl.toFixed(2) : '—'} suffix={account?.currency} valueColor="red" delay={0.45} />
          <StatCard label="Best Symbol" value={analytics?.best_symbol ?? '—'} delay={0.5} />
          <StatCard label="Best Day" value={analytics?.best_day_of_week ?? '—'} delay={0.55} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Equity Curve */}
          <EquityCurve data={equityPoints} initialBalance={account?.initial_balance || 10000} currency={account?.currency} />

          {/* Win/Loss Bar */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="section-title mb-4">Win vs Loss Distribution</h3>
            {analytics && analytics.total_trades > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={winLossData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {winLossData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <p className="text-text-muted text-sm">No trade data yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Streak summary */}
        {analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card p-5">
            <h3 className="section-title mb-4">Streak Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="metric-label">Longest Win Streak</p>
                <p className="metric-value text-primary">{analytics.longest_win_streak}</p>
              </div>
              <div>
                <p className="metric-label">Longest Loss Streak</p>
                <p className="metric-value text-red-400">{analytics.longest_loss_streak}</p>
              </div>
              <div>
                <p className="metric-label">Total P&L</p>
                <p className={`metric-value ${analytics.total_pnl >= 0 ? 'text-primary' : 'text-red-400'}`}>
                  {analytics.total_pnl >= 0 ? '+' : ''}{analytics.total_pnl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="metric-label">Avg Duration</p>
                <p className="metric-value">{analytics.avg_trade_duration_minutes.toFixed(0)}m</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <div>
            <h3 className="section-title mb-3">AI Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} delay={i * 0.08} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
