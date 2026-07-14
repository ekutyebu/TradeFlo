'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { api, type Account } from '@/lib/api';
import { Save, Database, Shield, Bot, Zap, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', broker: '', currency: 'USD', max_daily_loss_pct: 2, max_drawdown_pct: 5, risk_per_trade_pct: 1 });
  const [newAccount, setNewAccount] = useState({ name: '', broker: '', initial_balance: '', currency: 'USD', max_daily_loss_pct: 2, max_drawdown_pct: 5, risk_per_trade_pct: 1 });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.accounts.list().then((accounts) => {
      if (accounts.length) {
        const acc = accounts[0];
        setAccount(acc);
        setForm({ name: acc.name, broker: acc.broker || '', currency: acc.currency, max_daily_loss_pct: acc.max_daily_loss_pct, max_drawdown_pct: acc.max_drawdown_pct, risk_per_trade_pct: acc.risk_per_trade_pct });
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!account) return;
    setLoading(true);
    try {
      await api.accounts.update(account.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name || !newAccount.initial_balance) return;
    setLoading(true);
    try {
      const acc = await api.accounts.create({ ...newAccount, initial_balance: parseFloat(newAccount.initial_balance) });
      setAccount(acc);
      setForm({ name: acc.name, broker: acc.broker || '', currency: acc.currency, max_daily_loss_pct: acc.max_daily_loss_pct, max_drawdown_pct: acc.max_drawdown_pct, risk_per_trade_pct: acc.risk_per_trade_pct });
    } catch (e: any) { alert('Error creating account: ' + e.message); }
    setLoading(false);
  };

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="max-w-2xl space-y-6">
        {/* Account Setup */}
        {!account ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Database size={16} className="text-primary" />
              <h3 className="section-title">Create Your Trading Account</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="metric-label block mb-1">Account Name *</label>
                  <input value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="input-field" placeholder="My Prop Account" />
                </div>
                <div>
                  <label className="metric-label block mb-1">Broker</label>
                  <input value={newAccount.broker} onChange={(e) => setNewAccount({ ...newAccount, broker: e.target.value })} className="input-field" placeholder="FTMO, Funded Next…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="metric-label block mb-1">Initial Balance *</label>
                  <input type="number" value={newAccount.initial_balance} onChange={(e) => setNewAccount({ ...newAccount, initial_balance: e.target.value })} className="input-field" placeholder="10000" />
                </div>
                <div>
                  <label className="metric-label block mb-1">Currency</label>
                  <select value={newAccount.currency} onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })} className="select-field">
                    {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="metric-label block mb-1">Daily Loss Limit %</label>
                  <input type="number" step="0.1" value={newAccount.max_daily_loss_pct} onChange={(e) => setNewAccount({ ...newAccount, max_daily_loss_pct: parseFloat(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="metric-label block mb-1">Max Drawdown %</label>
                  <input type="number" step="0.1" value={newAccount.max_drawdown_pct} onChange={(e) => setNewAccount({ ...newAccount, max_drawdown_pct: parseFloat(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="metric-label block mb-1">Risk Per Trade %</label>
                  <input type="number" step="0.1" value={newAccount.risk_per_trade_pct} onChange={(e) => setNewAccount({ ...newAccount, risk_per_trade_pct: parseFloat(e.target.value) })} className="input-field" />
                </div>
              </div>
              <button onClick={handleCreateAccount} disabled={loading} className="btn-primary w-full justify-center">
                <Zap size={14} />
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Account Settings */
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Database size={16} className="text-primary" />
              <h3 className="section-title">Account Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="metric-label block mb-1">Account Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="metric-label block mb-1">Broker</label>
                  <input value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="metric-label block mb-1">Daily Loss Limit %</label>
                  <input type="number" step="0.1" value={form.max_daily_loss_pct} onChange={(e) => setForm({ ...form, max_daily_loss_pct: parseFloat(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="metric-label block mb-1">Max Drawdown %</label>
                  <input type="number" step="0.1" value={form.max_drawdown_pct} onChange={(e) => setForm({ ...form, max_drawdown_pct: parseFloat(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="metric-label block mb-1">Risk Per Trade %</label>
                  <input type="number" step="0.1" value={form.risk_per_trade_pct} onChange={(e) => setForm({ ...form, risk_per_trade_pct: parseFloat(e.target.value) })} className="input-field" />
                </div>
              </div>
              <button onClick={handleSave} disabled={loading} className="btn-primary gap-2">
                {saved ? <CheckCircle size={14} /> : <Save size={14} />}
                {loading ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* AI Settings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Bot size={16} className="text-primary" />
            <h3 className="section-title">AI Coach (FloAI)</h3>
          </div>
          <p className="text-xs text-text-muted mb-3">
            FloAI uses the Gemini API for intelligent conversations. Add your API key to <code className="text-primary bg-bg-base px-1 rounded">backend/.env</code>:
          </p>
          <div className="bg-bg-base rounded-lg p-3 border border-bg-border font-mono text-xs text-primary">
            GEMINI_API_KEY=your-key-here
          </div>
          <p className="text-xs text-text-muted mt-2">
            Get a free key at <a href="https://aistudio.google.com" target="_blank" className="text-primary hover:underline">aistudio.google.com</a>
          </p>
        </motion.div>

        {/* Deployment Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Shield size={16} className="text-primary" />
            <h3 className="section-title">Deployment</h3>
          </div>
          <div className="space-y-2 text-xs text-text-muted">
            <p>Frontend: <span className="text-primary font-mono">http://localhost:3000</span></p>
            <p>Backend API: <span className="text-primary font-mono">http://localhost:8000</span></p>
            <p>API Docs: <a href="http://localhost:8000/docs" target="_blank" className="text-primary hover:underline font-mono">http://localhost:8000/docs</a></p>
            <p className="mt-3">For Cloudflare Tunnel deployment, see <code className="text-primary">docs/deployment/cloudflare-tunnel.md</code></p>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
