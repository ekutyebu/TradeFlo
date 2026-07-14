'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
  accountName?: string;
  balance?: number;
  currency?: string;
  todayPnl?: number;
}

export default function AppShell({
  children,
  accountName,
  balance,
  currency,
  todayPnl,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[220px] overflow-hidden">
        <TopBar
          accountName={accountName}
          balance={balance}
          currency={currency}
          todayPnl={todayPnl}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
