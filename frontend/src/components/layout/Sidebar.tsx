'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, LineChart, BookOpen, BarChart2,
  Bot, Settings, TrendingUp, Zap, ChevronRight,
  Flame, Play, Brain, GraduationCap, FileText,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/chart',     label: 'Chart',      icon: LineChart },
  { href: '/trade',     label: 'Trade',      icon: Flame },
  { href: '/journal',   label: 'Journal',    icon: BookOpen },
  { href: '/backtest',  label: 'Backtesting', icon: Play },
  { href: '/notebook',  label: 'Notebook',   icon: FileText },
  { href: '/sanctuary', label: 'Sanctuary',  icon: Brain },
  { href: '/academy',   label: 'Academy',    icon: GraduationCap },
  { href: '/ai-coach',  label: 'AI Coach',   icon: Bot },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-40"
      style={{
        background: 'linear-gradient(180deg, #13151A 0%, #0F1014 100%)',
        borderRight: '1px solid #1E2028',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="relative">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <TrendingUp size={16} className="text-white" />
          </div>
          <div
            className="absolute inset-0 rounded-lg blur-md opacity-50"
            style={{ background: '#10B981' }}
          />
        </div>
        <div>
          <span className="text-base font-bold text-text-primary tracking-tight">TradeFlo</span>
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-primary" />
            <span className="text-[10px] text-primary font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Glow line */}
      <div className="glow-line mx-5 mb-4" />

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={clsx('nav-item', active && 'active')}
              >
                <Icon size={16} className={active ? 'text-primary' : 'text-text-muted'} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={12} className="text-primary opacity-60" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-0.5">
        <div className="glow-line mb-3" />
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={clsx('nav-item', active && 'active')}
              >
                <Icon size={16} className={active ? 'text-primary' : 'text-text-muted'} />
                <span>{label}</span>
              </motion.div>
            </Link>
          );
        })}

        {/* Version badge */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-bg-base border border-bg-border">
          <p className="text-[10px] text-text-muted">TradeFlo v1.0</p>
          <p className="text-[10px] text-primary">by Ekuty</p>
        </div>
      </div>
    </motion.aside>
  );
}
