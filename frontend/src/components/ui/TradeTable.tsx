'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ArrowUp, ArrowDown, ExternalLink, Trash2 } from 'lucide-react';
import type { Trade } from '@/lib/api';
import clsx from 'clsx';

interface TradeTableProps {
  trades: Trade[];
  currency?: string;
  onDelete?: (id: number) => void;
  compact?: boolean;
}

export default function TradeTable({
  trades,
  currency = 'USD',
  onDelete,
  compact = false,
}: TradeTableProps) {
  if (!trades.length) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-text-muted text-sm">No trades found.</p>
        <p className="text-text-subtle text-xs mt-1">Log your first trade using the + button above.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Entry</th>
              <th>Exit</th>
              {!compact && <th>Size</th>}
              <th>P&L</th>
              {!compact && <th>R:R</th>}
              {!compact && <th>Setup</th>}
              <th>Date</th>
              {onDelete && <th></th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {trades.map((trade, i) => {
                const isWin = trade.pnl > 0;
                const isLoss = trade.pnl < 0;
                return (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <td>
                      <span className="font-semibold text-text-primary">{trade.symbol}</span>
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          trade.side === 'BUY'
                            ? 'bg-primary-dim text-primary'
                            : 'bg-red-dim text-red-400',
                        )}
                      >
                        {trade.side === 'BUY' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                        {trade.side}
                      </span>
                    </td>
                    <td className="tabular-nums text-text-muted">{trade.entry_price.toFixed(5)}</td>
                    <td className="tabular-nums text-text-muted">
                      {trade.exit_price ? trade.exit_price.toFixed(5) : '—'}
                    </td>
                    {!compact && (
                      <td className="tabular-nums text-text-muted">{trade.lot_size}</td>
                    )}
                    <td>
                      <span
                        className={clsx(
                          'font-semibold tabular-nums',
                          isWin && 'text-primary',
                          isLoss && 'text-red-400',
                          !isWin && !isLoss && 'text-text-muted',
                        )}
                      >
                        {isWin ? '+' : ''}{trade.pnl.toFixed(2)}
                      </span>
                    </td>
                    {!compact && (
                      <td className="tabular-nums text-text-muted">
                        {trade.rr_ratio ? `${trade.rr_ratio.toFixed(2)}R` : '—'}
                      </td>
                    )}
                    {!compact && (
                      <td>
                        {trade.setup_tag ? (
                          <span className="badge-neutral text-xs">{trade.setup_tag}</span>
                        ) : '—'}
                      </td>
                    )}
                    <td className="text-text-muted whitespace-nowrap">
                      {format(parseISO(trade.entry_time), 'MMM dd, HH:mm')}
                    </td>
                    {onDelete && (
                      <td>
                        <button
                          onClick={() => onDelete(trade.id)}
                          className="p-1 rounded hover:bg-red-dim text-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
