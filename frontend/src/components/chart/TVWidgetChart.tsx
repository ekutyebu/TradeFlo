'use client';

import { useEffect, useRef } from 'react';

interface TVWidgetChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number;
}

/**
 * TradingView Advanced Chart HTML Widget (fallback)
 * When TradingView Charting Library is obtained, replace this with TVAdvancedChart.tsx
 * The widget already includes drawing tools, multi-timeframe, etc.
 */
export default function TVWidgetChart({
  symbol = 'OANDA:EURUSD',
  interval = '60',
  theme = 'dark',
  height = 520,
}: TVWidgetChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme,
      style: '1',                  // Candlestick
      locale: 'en',
      backgroundColor: '#0D0E12',
      gridColor: 'rgba(30,32,40,0.8)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      // Drawing tools are available via the toolbar
      // Studies are intentionally omitted per product requirements
      studies: [],
    });

    containerRef.current.appendChild(script);
    widgetRef.current = script;

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol, interval, theme]);

  return (
    <div
      className="tradingview-widget-container w-full rounded-xl overflow-hidden border border-bg-border"
      style={{ height }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container__widget w-full h-full"
      />
    </div>
  );
}
