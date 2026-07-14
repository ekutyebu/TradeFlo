'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import TVWidgetChart from '@/components/chart/TVWidgetChart';
import { Clock, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const TIMEFRAMES = [
  { label: '1M', value: '1' },
  { label: '5M', value: '5' },
  { label: '15M', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
];

const SYMBOLS = [
  'OANDA:EURUSD', 'OANDA:GBPUSD', 'OANDA:USDJPY', 'OANDA:AUDUSD',
  'CAPITALCOM:GOLD', 'NASDAQ:NQ1!', 'FOREXCOM:SPXUSD', 'BINANCE:BTCUSDT',
];

export default function ChartPage() {
  const [symbol, setSymbol] = useState('OANDA:EURUSD');
  const [interval, setInterval] = useState('60');
  const [customSymbol, setCustomSymbol] = useState('');

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Chart Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol picker */}
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="select-field pr-8 min-w-[160px]"
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>{s.split(':')[1]}</option>
              ))}
            </select>
          </div>

          {/* Custom symbol */}
          <input
            type="text"
            placeholder="Custom symbol…"
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customSymbol.trim()) {
                setSymbol(customSymbol.trim().toUpperCase());
              }
            }}
            className="input-field w-36"
          />

          {/* Timeframes */}
          <div className="flex items-center gap-0.5 p-1 bg-bg-surface rounded-lg border border-bg-border">
            <Clock size={12} className="text-text-muted ml-1 mr-1" />
            {TIMEFRAMES.map((tf) => (
              <motion.button
                key={tf.value}
                whileTap={{ scale: 0.92 }}
                onClick={() => setInterval(tf.value)}
                className={clsx(
                  'px-3 py-1 rounded text-xs font-medium transition-all duration-150',
                  interval === tf.value
                    ? 'bg-primary text-bg-base'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover',
                )}
              >
                {tf.label}
              </motion.button>
            ))}
          </div>

          {/* Info badge */}
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-dim border border-primary/20">
            <span className="text-xs text-primary font-medium">
              Drawing tools available in the chart toolbar →
            </span>
          </div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <TVWidgetChart
            symbol={symbol}
            interval={interval}
            theme="dark"
            height={580}
          />
        </motion.div>

        {/* Note about Advanced Charts */}
        <div className="glass-card p-4 flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-amber-dim border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-amber-400 text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">TradingView Advanced Charts</p>
            <p className="text-xs text-text-muted mt-0.5">
              Currently using the TradingView HTML Widget as a placeholder. 
              All drawing tools (trendlines, Fibonacci, Pitchfork, etc.) and multi-timeframe support are available above.
              When you obtain a TradingView Charting Library license, swap{' '}
              <code className="text-primary bg-bg-base px-1 rounded">TVWidgetChart</code> with{' '}
              <code className="text-primary bg-bg-base px-1 rounded">TVAdvancedChart</code>.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
