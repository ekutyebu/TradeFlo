'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { api, type Account, type BacktestRun } from '@/lib/api';
import { Play, Plus, X, Trash2, TrendingUp, HelpCircle, BarChart2 } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

const TIMEFRAMES = ['1M', '5M', '15M', '1H', '4H', '1D'];
const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'US30'];

export default function BacktestPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    strategy_name: '',
    symbol: 'EURUSD',
    timeframe: '15M',
    trades_count: '',
    wins: '',
    losses: '',
    total_pnl: '',
    notes: '',
  });

  useEffect(() => {
    async function load() {
      const accounts = await api.accounts.list().catch(() => []);
      if (!accounts.length) return;
      setAccount(accounts[0]);
      const backtestRuns = await api.backtest.list(accounts[0].id).catch(() => []);
      setRuns(backtestRuns);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setLoading(true);

    try {
      const tradesCount = parseInt(form.trades_count) || 0;
      const winsCount = parseInt(form.wins) || 0;
      const lossesCount = parseInt(form.losses) || 0;

      if (winsCount + lossesCount !== tradesCount) {
        alert("Wins + Losses must equal the total number of trades.");
        setLoading(false);
        return;
      }

      const payload = {
        account_id: account.id,
        strategy_name: form.strategy_name,
        symbol: form.symbol,
        timeframe: form.timeframe,
        trades_count: tradesCount,
        wins: winsCount,
        losses: lossesCount,
        total_pnl: parseFloat(form.total_pnl) || 0.0,
        notes: form.notes || undefined,
      };

      const newRun = await api.backtest.create(payload);
      setRuns((prev) => [newRun, ...prev]);
      setShowForm(false);
      
      // Reset form
      setForm({
        strategy_name: '',
        symbol: 'EURUSD',
        timeframe: '15M',
        trades_count: '',
        wins: '',
        losses: '',
        total_pnl: '',
        notes: '',
      });
    } catch (err: any) {
      alert("Error saving backtest run: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this backtest session?')) return;
    await api.backtest.delete(id).catch(() => {});
    setRuns((prev) => prev.filter((r) => r.id !== id));
  };

  // Performance summaries
  const totalTradesCount = runs.reduce((sum, r) => sum + r.trades_count, 0);
  const totalWinsCount = runs.reduce((sum, r) => sum + r.wins, 0);
  const aggregateWinRate = totalTradesCount > 0 ? (totalWinsCount / totalTradesCount) * 100 : 0;
  const netPnl = runs.reduce((sum, r) => sum + r.total_pnl, 0);

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Backtesting Workspace</h2>
            <p className="text-xs text-text-muted mt-0.5">Track historical simulation sessions</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus size={14} />
            Log Session
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Simulated Trades"
            value={totalTradesCount}
            subtext={`${runs.length} logged sessions`}
            delay={0}
          />
          <StatCard
            label="Average Win Rate"
            value={`${aggregateWinRate.toFixed(1)}%`}
            highlight={aggregateWinRate >= 50}
            delay={0.05}
          />
          <StatCard
            label="Simulated Net Return"
            value={`${netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}`}
            suffix={account?.currency}
            valueColor={netPnl >= 0 ? 'primary' : 'red'}
            delay={0.1}
          />
        </div>

        {/* Logs Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-bg-border flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Backtest Log</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Symbol</th>
                  <th>TF</th>
                  <th>Trades</th>
                  <th>Wins / Losses</th>
                  <th>Win Rate</th>
                  <th>Net P&L</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-text-muted text-sm">
                      No backtest logs found. Start logging to evaluate your strategies!
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => {
                    const wr = run.trades_count > 0 ? (run.wins / run.trades_count) * 100 : 0;
                    return (
                      <tr key={run.id}>
                        <td>
                          <span className="font-semibold text-text-primary">{run.strategy_name}</span>
                        </td>
                        <td><span className="badge-neutral">{run.symbol}</span></td>
                        <td className="text-text-muted">{run.timeframe}</td>
                        <td className="tabular-nums text-text-muted">{run.trades_count}</td>
                        <td className="tabular-nums text-text-muted">
                          <span className="text-primary font-medium">{run.wins}W</span>
                          {' / '}
                          <span className="text-red-400 font-medium">{run.losses}L</span>
                        </td>
                        <td className="font-semibold tabular-nums text-text-primary">
                          {wr.toFixed(1)}%
                        </td>
                        <td className={`font-semibold tabular-nums ${run.total_pnl >= 0 ? 'text-primary' : 'text-red-400'}`}>
                          {run.total_pnl >= 0 ? '+' : ''}{run.total_pnl.toFixed(2)}
                        </td>
                        <td className="text-text-muted text-xs max-w-[200px] truncate">{run.notes || '—'}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(run.id)}
                            className="p-1 rounded hover:bg-red-dim text-text-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 border-b border-bg-border">
                  <h3 className="font-semibold text-text-primary">Log Simulation Run</h3>
                  <button onClick={() => setShowForm(false)} className="btn-ghost !px-2 !py-2">
                    <X size={14} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="metric-label block mb-1">Strategy Name *</label>
                    <input
                      required
                      value={form.strategy_name}
                      onChange={(e) => setForm({ ...form, strategy_name: e.target.value })}
                      className="input-field"
                      placeholder="e.g. SMC BOS Liquidity Grab"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="metric-label block mb-1">Symbol</label>
                      <select
                        value={form.symbol}
                        onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                        className="select-field"
                      >
                        {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Timeframe</label>
                      <select
                        value={form.timeframe}
                        onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                        className="select-field"
                      >
                        {TIMEFRAMES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="metric-label block mb-1">Total Trades *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={form.trades_count}
                        onChange={(e) => setForm({ ...form, trades_count: e.target.value })}
                        className="input-field"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Wins *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={form.wins}
                        onChange={(e) => setForm({ ...form, wins: e.target.value })}
                        className="input-field"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Losses *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={form.losses}
                        onChange={(e) => setForm({ ...form, losses: e.target.value })}
                        className="input-field"
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="metric-label block mb-1">Net P&L *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={form.total_pnl}
                      onChange={(e) => setForm({ ...form, total_pnl: e.target.value })}
                      className="input-field"
                      placeholder="+2450.00"
                    />
                  </div>

                  <div>
                    <label className="metric-label block mb-1">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="input-field resize-none"
                      rows={2}
                      placeholder="Confluences, failures, retrace details..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                      {loading ? 'Saving...' : 'Save Run'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
}
