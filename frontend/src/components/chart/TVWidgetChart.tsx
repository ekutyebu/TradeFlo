'use client';

import { useEffect } from 'react';

interface TVWidgetChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number;
}

export default function TVWidgetChart({
  symbol = 'OANDA:EURUSD',
  interval = '60',
  theme = 'dark',
  height = 520,
}: TVWidgetChartProps) {
  useEffect(() => {
    const scriptId = 'tradingview-tv-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol,
          interval,
          timezone: 'Etc/UTC',
          theme,
          style: '1',                  // Candlestick
          locale: 'en',
          toolbar_bg: '#13151A',
          enable_publishing: false,
          hide_side_toolbar: false,    // Set to false to show complete drawing tools toolbar!
          allow_symbol_change: true,
          container_id: 'tv-chart-container',
          studies: ["Volume@tv-basicstudies"],
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      // If script is already loaded, instantiate directly
      if ((window as any).TradingView) {
        initWidget();
      } else {
        // Fallback in case script is in head but not loaded yet
        script.addEventListener('load', initWidget);
      }
    }

    return () => {
      // No need to remove script from head, just clean up container
      const container = document.getElementById('tv-chart-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval, theme]);

  return (
    <div
      className="tradingview-widget-container w-full rounded-xl overflow-hidden border border-bg-border bg-bg-surface"
      style={{ height }}
    >
      <div
        id="tv-chart-container"
        className="w-full h-full"
      />
    </div>
  );
}
