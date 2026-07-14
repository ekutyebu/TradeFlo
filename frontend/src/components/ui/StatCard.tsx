'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  highlight?: boolean;
  delay?: number;
  prefix?: string;
  suffix?: string;
  valueColor?: 'primary' | 'red' | 'amber' | 'default';
}

export default function StatCard({
  label,
  value,
  subtext,
  trend,
  trendValue,
  highlight = false,
  delay = 0,
  prefix = '',
  suffix = '',
  valueColor = 'default',
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const valueClasses = {
    primary: 'text-primary',
    red: 'text-red-400',
    amber: 'text-amber-400',
    default: 'text-text-primary',
  }[valueColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={clsx(
        'stat-card transition-all duration-200',
        highlight && 'border-primary/30',
        highlight && 'shadow-glow-sm',
      )}
      style={highlight ? { boxShadow: '0 0 20px rgba(16,185,129,0.12)' } : {}}
    >
      {/* Label */}
      <p className="metric-label">{label}</p>

      {/* Value */}
      <div className="flex items-baseline gap-1 mt-1">
        {prefix && <span className="text-sm text-text-muted">{prefix}</span>}
        <span className={clsx('metric-value', valueClasses)}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {suffix && <span className="text-sm text-text-muted">{suffix}</span>}
      </div>

      {/* Subtext / Trend */}
      <div className="flex items-center gap-2 mt-1">
        {trend && trendValue && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' && 'text-primary',
              trend === 'down' && 'text-red-400',
              trend === 'neutral' && 'text-text-muted',
            )}
          >
            <TrendIcon size={11} />
            <span>{trendValue}</span>
          </div>
        )}
        {subtext && <span className="text-xs text-text-muted">{subtext}</span>}
      </div>
    </motion.div>
  );
}
