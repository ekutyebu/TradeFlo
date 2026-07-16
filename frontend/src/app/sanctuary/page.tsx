'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { api, type Account } from '@/lib/api';
import { Brain, Sparkles, Play, Square, Heart } from 'lucide-react';

type BreatheState = 'idle' | 'inhale' | 'hold' | 'exhale';

export default function SanctuaryPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [breatheState, setBreatheState] = useState<BreatheState>('idle');
  const [cycleCount, setCycleCount] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    api.accounts.list().then((accounts) => {
      if (accounts.length) setAccount(accounts[0]);
    }).catch(() => {});
  }, []);

  // Breathing loop controller (4-7-8 Breathing Technique)
  useEffect(() => {
    if (breatheState === 'idle') return;

    let interval = setInterval(() => {
      setTimer((prev) => {
        if (breatheState === 'inhale' && prev >= 4) {
          setBreatheState('hold');
          return 1;
        } else if (breatheState === 'hold' && prev >= 7) {
          setBreatheState('exhale');
          return 1;
        } else if (breatheState === 'exhale' && prev >= 8) {
          setBreatheState('inhale');
          setCycleCount((c) => c + 1);
          return 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breatheState]);

  const startBreathing = () => {
    setBreatheState('inhale');
    setTimer(1);
    setCycleCount(1);
  };

  const stopBreathing = () => {
    setBreatheState('idle');
    setTimer(0);
    setCycleCount(0);
  };

  // UI helpers
  const bubbleScale = {
    idle: 1.0,
    inhale: 1.6,
    hold: 1.6,
    exhale: 1.0,
  }[breatheState];

  const bubbleColor = {
    idle: 'rgba(16, 185, 129, 0.15)', // dim green
    inhale: 'rgba(16, 185, 129, 0.3)', // bright green
    hold: 'rgba(59, 130, 246, 0.3)',  // blue glow
    exhale: 'rgba(239, 68, 68, 0.15)', // warm red re-center
  }[breatheState];

  const instructionText = {
    idle: 'Ready to Reset?',
    inhale: 'Inhale Deeply',
    hold: 'Hold Breath',
    exhale: 'Exhale Slowly',
  }[breatheState];

  const instructionSubText = {
    idle: 'Click play to start the 4-7-8 mindfulness re-centering exercise.',
    inhale: 'Expand your chest (4 seconds)',
    hold: 'Let the anxiety settle (7 seconds)',
    exhale: 'Release all tension (8 seconds)',
  }[breatheState];

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4 max-w-xl mx-auto space-y-8">
        
        {/* Header Intro */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-primary-dim border border-primary/20 text-primary mb-2">
            <Brain size={24} />
          </div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Psychology Sanctuary</h2>
          <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
            Revenge trading and FOMO happen when you operate in a high-cortisol, reactive state. Take 2 minutes to reset your nervous system.
          </p>
        </div>

        {/* Breathing Circle Widget */}
        <div className="glass-card w-full p-8 py-12 flex flex-col items-center justify-center relative border-primary/10 overflow-hidden">
          
          <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

          {/* Animated Circle */}
          <div className="relative w-48 h-48 flex items-center justify-center my-6">
            <motion.div
              animate={{
                scale: bubbleScale,
                backgroundColor: bubbleColor,
                boxShadow: breatheState === 'hold' 
                  ? '0 0 40px rgba(59,130,246,0.3)' 
                  : breatheState === 'inhale' 
                  ? '0 0 30px rgba(16,185,129,0.3)'
                  : '0 0 10px rgba(255,255,255,0.02)',
              }}
              transition={{
                duration: breatheState === 'inhale' ? 4 : breatheState === 'exhale' ? 8 : 1,
                ease: 'easeInOut',
              }}
              className="absolute w-28 h-28 rounded-full border border-white/5 flex items-center justify-center"
            />

            {/* Timed Value / Counter */}
            <div className="absolute text-center z-10 select-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={instructionText}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-black text-text-primary block uppercase tracking-wider"
                >
                  {instructionText}
                </motion.span>
              </AnimatePresence>

              {breatheState !== 'idle' && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-black text-primary block mt-1 tabular-nums"
                >
                  {timer}s
                </motion.span>
              )}
            </div>
          </div>

          {/* Helper details */}
          <div className="text-center space-y-1 h-14 mt-4">
            <p className="text-xs text-text-muted max-w-xs mx-auto leading-normal">
              {instructionSubText}
            </p>
            {breatheState !== 'idle' && (
              <span className="text-[10px] text-primary bg-primary-dim px-2 py-0.5 rounded-full inline-block font-semibold mt-2">
                Cycle {cycleCount} of 4
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {breatheState === 'idle' ? (
              <button
                onClick={startBreathing}
                className="btn-primary gap-2 !px-6 !py-3 font-semibold shadow-glow-sm"
              >
                <Play size={14} fill="currentColor" />
                Start Breathing Exercise
              </button>
            ) : (
              <button
                onClick={stopBreathing}
                className="btn-danger gap-2 !px-6 !py-3 font-semibold border-red-500/20"
              >
                <Square size={14} fill="currentColor" />
                Stop Reset
              </button>
            )}
          </div>

        </div>

        {/* Psychology Cheat Sheet */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="glass-card p-4 space-y-1 bg-bg-surface/50 border border-bg-border/60">
            <div className="flex items-center gap-2 text-primary">
              <Heart size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Breathing Rules</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Inhale quietly through your nose (4s), hold (7s), and exhale completely with a whoosh sound (8s).
            </p>
          </div>
          <div className="glass-card p-4 space-y-1 bg-bg-surface/50 border border-bg-border/60">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">The 2-Min Reset</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Completing 4 cycles reduces physical adrenaline, resets your heart rate, and breaks the cycle of revenge trading.
            </p>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
