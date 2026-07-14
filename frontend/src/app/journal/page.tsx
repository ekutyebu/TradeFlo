'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import TradeTable from '@/components/ui/TradeTable';
import { api, type Trade, type Account } from '@/lib/api';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'US30', 'AUDUSD', 'USDCAD'];
const SETUPS = ['Break of Structure', 'Fair Value Gap', 'Order Block', 'Liquidity Grab', 'Breaker Block', 'Supply/Demand', 'Trendline Break', 'Other'];

export default function JournalPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    symbol: 'EURUSD',
    side: 'BUY',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    lot_size: '',
    pnl: '',
    rr_ratio: '',
    entry_time: new Date().toISOString().slice(0, 16),
    exit_time: '',
    setup_tag: '',
    confluence: '',
    mistakes: '',
    notes: '',
  });

  useEffect(() => {
    async function load() {
      const accounts = await api.accounts.list().catch(() => []);
      if (!accounts.length) return;
      setAccount(accounts[0]);
      const tradeData = await api.trades.list({ account_id: accounts[0].id, limit: 100 }).catch(() => []);
      setTrades(tradeData);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setLoading(true);
    try {
      const payload = {
        account_id: account.id,
        symbol: form.symbol.toUpperCase(),
        side: form.side as 'BUY' | 'SELL',
        entry_price: parseFloat(form.entry_price),
        exit_price: form.exit_price ? parseFloat(form.exit_price) : undefined,
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : undefined,
        take_profit: form.take_profit ? parseFloat(form.take_profit) : undefined,
        lot_size: parseFloat(form.lot_size),
        pnl: parseFloat(form.pnl) || 0,
        rr_ratio: form.rr_ratio ? parseFloat(form.rr_ratio) : undefined,
        entry_time: new Date(form.entry_time).toISOString(),
        exit_time: form.exit_time ? new Date(form.exit_time).toISOString() : undefined,
        status: 'CLOSED' as const,
        setup_tag: form.setup_tag || undefined,
        confluence: form.confluence || undefined,
        mistakes: form.mistakes || undefined,
        notes: form.notes || undefined,
        balance_before: account.current_balance,
        balance_after: account.current_balance + (parseFloat(form.pnl) || 0),
      };
      const newTrade = await api.trades.create(payload);
      setTrades((prev) => [newTrade, ...prev]);
      setShowForm(false);
    } catch (err: any) {
      alert('Error saving trade: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this trade?')) return;
    await api.trades.delete(id).catch(() => {});
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Trade Journal</h2>
            <p className="text-xs text-text-muted mt-0.5">{trades.length} trades logged</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus size={14} />
            Log Trade
          </motion.button>
        </div>

        {/* Trade Table */}
        <TradeTable trades={trades} currency={account?.currency} onDelete={handleDelete} />

        {/* Trade Form Modal */}
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
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between p-5 border-b border-bg-border">
                  <h3 className="font-semibold text-text-primary">Log New Trade</h3>
                  <button onClick={() => setShowForm(false)} className="btn-ghost !px-2 !py-2">
                    <X size={14} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Row 1: Symbol + Side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="metric-label block mb-1">Symbol</label>
                      <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="select-field">
                        {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Side</label>
                      <div className="flex gap-2">
                        {(['BUY', 'SELL'] as const).map((s) => (
                          <button
                            key={s} type="button"
                            onClick={() => setForm({ ...form, side: s })}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                              form.side === s
                                ? s === 'BUY' ? 'bg-primary-dim border-primary/40 text-primary' : 'bg-red-dim border-red-500/40 text-red-400'
                                : 'border-bg-border text-text-muted hover:bg-bg-hover'
                            }`}
                          >
                            {s === 'BUY' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="metric-label block mb-1">Entry Price *</label>
                      <input required type="number" step="any" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} className="input-field" placeholder="1.08500" />
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Exit Price</label>
                      <input type="number" step="any" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })} className="input-field" placeholder="1.09000" />
                    </div>
                  </div>

                  {/* Row 3: SL/TP/Size */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="metric-label block mb-1">Stop Loss</label>
                      <input type="number" step="any" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })} className="input-field" placeholder="1.08000" />
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Take Profit</label>
                      <input type="number" step="any" value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: e.target.value })} className="input-field" placeholder="1.09500" />
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Lot Size *</label>
                      <input required type="number" step="any" value={form.lot_size} onChange={(e) => setForm({ ...form, lot_size: e.target.value })} className="input-field" placeholder="0.10" />
                    </div>
                  </div>

                  {/* Row 4: P&L + R:R */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="metric-label block mb-1">P&L *</label>
                      <input required type="number" step="any" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} className="input-field" placeholder="+150.00" />
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Realized R:R</label>
                      <input type="number" step="any" value={form.rr_ratio} onChange={(e) => setForm({ ...form, rr_ratio: e.target.value })} className="input-field" placeholder="2.5" />
                    </div>
                  </div>

                  {/* Row 5: Times */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="metric-label block mb-1">Entry Time *</label>
                      <input required type="datetime-local" value={form.entry_time} onChange={(e) => setForm({ ...form, entry_time: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="metric-label block mb-1">Exit Time</label>
                      <input type="datetime-local" value={form.exit_time} onChange={(e) => setForm({ ...form, exit_time: e.target.value })} className="input-field" />
                    </div>
                  </div>

                  {/* Setup */}
                  <div>
                    <label className="metric-label block mb-1">Setup / Strategy</label>
                    <select value={form.setup_tag} onChange={(e) => setForm({ ...form, setup_tag: e.target.value })} className="select-field">
                      <option value="">Select setup…</option>
                      {SETUPS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Confluence */}
                  <div>
                    <label className="metric-label block mb-1">Confluences</label>
                    <textarea value={form.confluence} onChange={(e) => setForm({ ...form, confluence: e.target.value })} className="input-field resize-none" rows={2} placeholder="What supported this trade? (HTF bias, session, structure…)" />
                  </div>

                  {/* Mistakes */}
                  <div>
                    <label className="metric-label block mb-1">Mistakes / Lessons</label>
                    <textarea value={form.mistakes} onChange={(e) => setForm({ ...form, mistakes: e.target.value })} className="input-field resize-none" rows={2} placeholder="What could be improved?" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                      {loading ? 'Saving…' : 'Save Trade'}
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
