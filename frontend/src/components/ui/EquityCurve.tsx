'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { EquityPoint } from '@/lib/api';

interface EquityCurveProps {
  data: EquityPoint[];
  initialBalance: number;
  currency?: string;
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const pnl = point.payload.pnl;
  const isPositive = pnl >= 0;
  return (
    <div className="glass-card p-3 min-w-[160px] text-xs">
      <p className="text-text-muted mb-2">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-text-muted">Balance</span>
        <span className="font-semibold text-text-primary tabular-nums">
          {point.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
        </span>
      </div>
      <div className="flex justify-between gap-4 mt-1">
        <span className="text-text-muted">Trade P&L</span>
        <span className={`font-semibold tabular-nums ${isPositive ? 'text-primary' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{pnl.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default function EquityCurve({ data, initialBalance, currency = 'USD' }: EquityCurveProps) {
  const chartData = data.map((p) => ({
    date: format(parseISO(p.timestamp), 'MMM dd'),
    balance: p.balance,
    pnl: p.pnl,
    trade_id: p.trade_id,
  }));

  const isPositive = data.length > 0 && data[data.length - 1].balance >= initialBalance;
  const strokeColor = isPositive ? '#10B981' : '#EF4444';
  const gradientId = isPositive ? 'gradientGreen' : 'gradientRed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="section-title">Equity Curve</h3>
          <p className="text-xs text-text-muted mt-0.5">{data.length} closed trades</p>
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <p className={`text-lg font-bold tabular-nums ${isPositive ? 'text-primary' : 'text-red-400'}`}>
              {data[data.length - 1].balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
            </p>
            <p className="text-xs text-text-muted">Current balance</p>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center">
          <p className="text-text-muted text-sm">No closed trades yet. Start journaling!</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <ReferenceLine y={initialBalance} stroke="#374151" strokeDasharray="4 4" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
