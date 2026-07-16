'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { api, type Account } from '@/lib/api';
import { Flame, Shield, ArrowUp, ArrowDown, Calculator, Play, AlertCircle, RefreshCw } from 'lucide-react';

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'US30', 'AUDUSD'];

interface LiveTick {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: string;
}

export default function TradePage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [symbol, setSymbol] = useState('EURUSD');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [lotSize, setLotSize] = useState('0.1');
  const [stopLossPips, setStopLossPips] = useState('15');
  const [takeProfitPips, setTakeProfitPips] = useState('30');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Live price state
  const [price, setPrice] = useState<LiveTick | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load account
  useEffect(() => {
    api.accounts.list().then((accounts) => {
      if (accounts.length) setAccount(accounts[0]);
    }).catch(() => {});
  }, []);

  // Connect WebSocket for live price
  useEffect(() => {
    if (wsRef.current) wsRef.current.close();

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/market/${symbol}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const tick: LiveTick = JSON.parse(event.data);
      setPrice(tick);
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  // Dynamic calculations
  const balance = account?.current_balance ?? 10000;
  const riskPctLimit = account?.risk_per_trade_pct ?? 1;

  const numericSL = parseFloat(stopLossPips) || 0;
  const numericLots = parseFloat(lotSize) || 0;
  
  // Standard pip value (approx $10 per standard lot for 1 pip)
  const pipValue = symbol.includes('JPY') ? 8.5 : symbol.includes('GOLD') || symbol.includes('XAU') ? 1.0 : 10.0;
  
  const riskCash = numericLots * numericSL * pipValue;
  const riskPct = (riskCash / balance) * 100;
  const riskExceeded = riskPct > riskPctLimit;

  const handleExecute = async () => {
    if (!account) return;
    setExecuting(true);
    setResult(null);

    // Calculate absolute SL/TP prices
    const currentPrice = price?.ask ?? 1.08500;
    const pipScale = symbol.includes('JPY') ? 0.01 : symbol.includes('GOLD') || symbol.includes('XAU') ? 0.1 : 0.0001;
    
    let slPrice = 0;
    let tpPrice = 0;

    if (side === 'BUY') {
      slPrice = currentPrice - (numericSL * pipScale);
      tpPrice = currentPrice + ((parseFloat(takeProfitPips) || 0) * pipScale);
    } else {
      slPrice = currentPrice + (numericSL * pipScale);
      tpPrice = currentPrice - ((parseFloat(takeProfitPips) || 0) * pipScale);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/market/mt5/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.id,
          symbol,
          side,
          lot_size: numericLots,
          stop_loss: parseFloat(slPrice.toFixed(5)),
          take_profit: parseFloat(tpPrice.toFixed(5)),
          comment: "TradeFlo Instant Execute",
        }),
      });
      const data = await response.json();
      setResult(data);
      
      // Add execution details directly as a trade log in the db
      await api.trades.create({
        account_id: account.id,
        symbol,
        side,
        entry_price: currentPrice,
        exit_price: undefined,
        stop_loss: parseFloat(slPrice.toFixed(5)),
        take_profit: parseFloat(tpPrice.toFixed(5)),
        lot_size: numericLots,
        pnl: 0,
        pnl_pct: 0,
        planned_rr: (parseFloat(takeProfitPips) || 0) / (numericSL || 1),
        entry_time: new Date().toISOString(),
        status: 'OPEN',
        setup_tag: 'Instant Execution',
      });

    } catch (err: any) {
      setResult({ status: 'error', message: err.message });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Order Ticket */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 space-y-5"
          >
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-primary" />
              <h3 className="section-title">Order Ticket</h3>
            </div>

            {/* Instrument Pick */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="metric-label block mb-1">Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="select-field"
                >
                  {SYMBOLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="metric-label block mb-1">Direction</label>
                <div className="flex gap-2">
                  {(['BUY', 'SELL'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSide(s)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        side === s
                          ? s === 'BUY'
                            ? 'bg-primary-glow border-primary text-primary shadow-glow-sm'
                            : 'bg-red-dim border-red-400 text-red-400'
                          : 'border-bg-border text-text-muted hover:bg-bg-hover'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="metric-label block mb-1">Lots</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="input-field"
                  placeholder="0.10"
                />
              </div>
              <div>
                <label className="metric-label block mb-1">Stop Loss (Pips)</label>
                <input
                  type="number"
                  min="1"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(e.target.value)}
                  className="input-field"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="metric-label block mb-1">Take Profit (Pips)</label>
                <input
                  type="number"
                  min="1"
                  value={takeProfitPips}
                  onChange={(e) => setTakeProfitPips(e.target.value)}
                  className="input-field"
                  placeholder="30"
                />
              </div>
            </div>

            {/* Risk Dashboard widget */}
            <div className={`p-4 rounded-lg border transition-all ${
              riskExceeded
                ? 'bg-red-dim border-red-500/30 text-red-400'
                : 'bg-primary-dim border-primary/20 text-primary'
            }`}>
              <div className="flex items-start gap-2.5">
                <Calculator size={16} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase tracking-wider">Risk Projection</span>
                    {riskExceeded && (
                      <span className="text-[10px] font-bold bg-red-400 text-bg-base px-1.5 py-0.5 rounded animate-pulse">
                        LIMIT EXCEEDED
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-[10px] opacity-70">Projected Risk Value</p>
                      <p className="text-lg font-black tabular-nums">
                        ${riskCash.toFixed(2)} {account?.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70">Percentage of Balance</p>
                      <p className="text-lg font-black tabular-nums">
                        {riskPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] opacity-65 mt-2">
                    Maximum risk allocation configured: <strong className="font-bold">{riskPctLimit}%</strong> per trade.
                  </p>
                </div>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleExecute}
              disabled={executing || !account}
              className={`w-full py-3.5 rounded-lg text-bg-base font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-98 ${
                side === 'BUY'
                  ? 'bg-primary hover:shadow-glow-md disabled:opacity-40'
                  : 'bg-red hover:shadow-glow-md disabled:opacity-40 !bg-red-500 text-white'
              }`}
            >
              {executing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Executing Order...
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  Place {side} Market Order
                </>
              )}
            </button>
          </motion.div>

          {/* Execution Result Log */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-card p-4 border-primary/20 space-y-2"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Shield size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Broker Logs</span>
                </div>
                <pre className="bg-bg-base rounded p-3 border border-bg-border font-mono text-xs text-text-muted overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Live Rates Watchlist */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 space-y-4 h-full"
          >
            <div>
              <h3 className="section-title">Market Feed</h3>
              <p className="text-xs text-text-muted mt-0.5">Live Bid/Ask quotes</p>
            </div>

            {/* Price Box */}
            <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex flex-col items-center justify-center text-center py-6">
              <span className="text-xs font-bold text-text-muted tracking-wide uppercase">{symbol}</span>
              
              <div className="grid grid-cols-2 gap-6 mt-4 w-full px-2">
                <div className="text-center border-r border-bg-border">
                  <span className="text-[10px] text-text-muted block uppercase font-medium">Bid (Sell)</span>
                  <span className="text-xl font-black text-red-400 tabular-nums block mt-1">
                    {price ? price.bid.toFixed(5) : '—'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-text-muted block uppercase font-medium">Ask (Buy)</span>
                  <span className="text-xl font-black text-primary tabular-nums block mt-1">
                    {price ? price.ask.toFixed(5) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-[10px] text-text-muted bg-bg-card border border-bg-border px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span>Spread: {price ? `${price.spread} pips` : 'calculating...'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Watchlist</span>
              {SYMBOLS.filter(s => s !== symbol).map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-bg-border bg-bg-surface hover:bg-bg-hover transition-colors text-xs text-left"
                >
                  <span className="font-semibold text-text-primary">{s}</span>
                  <span className="text-text-muted">Select →</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </AppShell>
  );
}
