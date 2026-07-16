'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { api, type Account } from '@/lib/api';
import { GraduationCap, BookOpen, Layers, Zap, Shield, Search } from 'lucide-react';

interface Lesson {
  id: string;
  category: string;
  title: string;
  description: string;
  markup: string;
  points: string[];
}

const LESSONS: Lesson[] = [
  {
    id: 'structure',
    category: 'Market Structure',
    title: 'BOS vs CHoCH',
    description: 'Structure is the foundation. A Break of Structure (BOS) confirms trend continuation. A Change of Character (CHoCH) signals the first sign of a trend shift.',
    markup: `
  BOS (Trend Continuation)             CHoCH (Trend Reversal)
      
       High                                  High (Liquidity Grab)
       /\                                    /\
      /  \    BOS                           /  \
     /    \   --->                         /    \   CHoCH
    /      \/\/\                          /      \/\/\
   /            \                        /            \  (Broke previous HL)
  /              \                      /              \
    `,
    points: [
      'BOS occurs in the direction of the current trend (High to Higher High).',
      'CHoCH breaks the previous Higher Low (Bullish to Bearish) or Lower High (Bearish to Bullish).',
      'Always look for sweeps of liquidity before a CHoCH.',
    ],
  },
  {
    id: 'fvg',
    category: 'Imbalances',
    title: 'Fair Value Gaps (FVG)',
    description: 'A Fair Value Gap is a 3-candle price imbalance created by aggressive buyers or sellers. It leaves a gap between the wick of candle 1 and candle 3, representing unfilled orders.',
    markup: `
  Bullish FVG (Imbalance)
  
  [Candle 1]  -- Wick Low --               
                 |
     =====>   [  G A P  ]   <-- Price imbalance acts as magnet
                 |
  [Candle 3]  -- Wick High --
    `,
    points: [
      'The gap acts as a price magnet. Price will retrace to fill at least 50% (Consequent Encroachment).',
      'Enter trades on the retest of the FVG in discounted pricing.',
      'Stop Loss is placed below the wick of Candle 1 for safety.',
    ],
  },
  {
    id: 'ob',
    category: 'Order Blocks',
    title: 'Institutional Order Blocks',
    description: 'An Order Block is the last consecutive opposite candle before an aggressive impulse move that breaks structure. It represents where institutions accumulated their positions.',
    markup: `
  Bearish Order Block (OB)
  
   [ Last Up Candle ]  <-- Order Block Zone (Institutions sell here)
         |  
         v
     [ Big Down Candle ] (Broke Structure)
         |
     [ Big Down Candle ]
    `,
    points: [
      'Look for wicks that grab liquidity right before the Order Block forms.',
      'Order Blocks must result in a BOS or FVG to be valid.',
      'Refine the OB on lower timeframes for tighter stop losses.',
    ],
  },
  {
    id: 'liquidity',
    category: 'Liquidity',
    title: 'Liquidity Pools & Sweeps',
    description: 'Institutions need counterparties to buy or sell large positions. They sweep equal highs (Buy-side Liquidity) or equal lows (Sell-side Liquidity) to trigger stop losses and fill their orders.',
    markup: `
  Sell-Side Liquidity (SSL) Grab
  
   Equal Lows (Retail Support Zone)
   ===============   <-- Retail stop losses sit here
          |
     [  S W E E P  ] <-- Price dips below, grabs stops, then reverses rapidly
          |
         /\
        /  \
    `,
    points: [
      'Equal Highs (EQH) and Equal Lows (EQL) contain massive amounts of resting stop losses.',
      'Wait for the sweep candle to close back inside the range before entering.',
      'The sweep is the fuel for the institutional reversal.',
    ],
  },
];

export default function AcademyPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(LESSONS[0]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.accounts.list().then((accounts) => {
      if (accounts.length) setAccount(accounts[0]);
    }).catch(() => {});
  }, []);

  const filtered = LESSONS.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-9rem)]">
        
        {/* Left Side: Lessons List */}
        <div className="md:col-span-1 glass-card flex flex-col overflow-hidden">
          
          <div className="p-3 border-b border-bg-border flex flex-col gap-2">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Trading Academy</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search concepts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !py-1.5 !pl-8 text-xs"
              />
              <Search className="absolute left-2.5 top-2.5 text-text-muted" size={12} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className={`w-full flex flex-col gap-1 p-2.5 rounded-lg text-left transition-colors ${
                  selectedLesson.id === lesson.id
                    ? 'bg-primary-dim border border-primary/20 text-text-primary'
                    : 'hover:bg-bg-hover text-text-muted hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen size={12} className="text-text-muted" />
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    {lesson.category}
                  </span>
                </div>
                <span className="text-xs font-bold">{lesson.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Lesson Viewer */}
        <div className="md:col-span-3 glass-card overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-bg-border bg-bg-surface flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-dim text-primary">
              <GraduationCap size={16} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                {selectedLesson.category}
              </span>
              <h3 className="text-sm font-bold text-text-primary mt-0.5">{selectedLesson.title}</h3>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Description */}
            <p className="text-xs text-text-muted leading-relaxed">
              {selectedLesson.description}
            </p>

            {/* ASCII Diagram Markup */}
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">Visual Diagram</span>
              <pre className="bg-bg-base rounded-xl p-4 border border-bg-border font-mono text-[10px] text-primary leading-tight overflow-x-auto select-none">
                {selectedLesson.markup}
              </pre>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Key Rules</span>
              <div className="space-y-2">
                {selectedLesson.points.map((pt, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="text-primary font-bold">{i+1}.</span>
                    <span className="text-text-muted leading-relaxed">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
