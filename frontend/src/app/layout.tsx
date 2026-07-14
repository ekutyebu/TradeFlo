import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradeFlo — Trading Operating System',
  description: 'Your personal trading OS. Journal, analyse, execute, and grow — with AI-powered coaching.',
  keywords: 'trading journal, trade analytics, AI coach, forex, futures, TradeFlo',
  authors: [{ name: 'Ekuty' }],
  openGraph: {
    title: 'TradeFlo — Trading Operating System',
    description: 'Trade with discipline, not emotion.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-bg-base text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
