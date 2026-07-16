'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { api, type Account, type NotebookPage } from '@/lib/api';
import { FileText, Plus, Save, Trash2, Edit3, Bookmark, CheckCircle, FileCode } from 'lucide-react';

const CATEGORIES = ['Strategy', 'Checklist', 'Rules', 'Review'];

const TEMPLATES = {
  checklist: `### PRE-MARKET TRADING CHECKLIST
- [ ] **HTF Bias:** Check Daily/4H structure & bias.
- [ ] **News Event:** Confirm there are no high-impact events during session.
- [ ] **Liquidity Pools:** Mark high/low liquidity levels.
- [ ] **Patience Check:** Am I chasing, or waiting for Price to tap my zone?
- [ ] **Risk Check:** Correct lot size calculated?
- [ ] **State Check:** Feeling calm, neutral, and detached from results?`,

  strategy: `### STRATEGY BLUEPRINT: SMC RETAIL LIQUIDITY GRAB
- **Market Structure:** BOS/CHoCH shift on 5m or 15m.
- **Entry Setup:** Fair Value Gap (FVG) retrace inside Premium/Discount.
- **Confluences:**
  1. Retail Trendline / Liquidity Sweep.
  2. Tap into HTF Order Block (OB).
  3. Fibonacci 61.8% - 78.6% Golden Ratio overlap.
- **Stop Loss Rule:** 2 pips below sweep low.
- **Take Profit Rule:** Next major liquidity level or fixed 1:3 R:R.`,

  review: `### WEEKLY TRADING PERFORMANCE REVIEW
- **Weekly Net Returns:**
- **Trades Executed / Win Rate:**
- **Adherence to Guardrails (0-10):**
- **Mental Hurdles Faced (e.g. FOMO, Revenge):**
- **Key Lessons & Adjustments for Next Week:**`
};

export default function NotebookPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<NotebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<NotebookPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Strategy');
  const [saved, setSaved] = useState(false);

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Strategy');

  useEffect(() => {
    async function load() {
      const accounts = await api.accounts.list().catch(() => []);
      if (!accounts.length) return;
      setAccount(accounts[0]);
      
      const notebookPages = await api.notebook.list(accounts[0].id).catch(() => []);
      setPages(notebookPages);
      if (notebookPages.length) {
        selectPage(notebookPages[0]);
      } else {
        createNewPage();
      }
    }
    load();
  }, []);

  const selectPage = (p: NotebookPage) => {
    setSelectedPage(p);
    setTitle(p.title);
    setContent(p.content);
    setCategory(p.category);
    setActiveCategory(p.category);
  };

  const createNewPage = () => {
    setSelectedPage(null);
    setTitle('Untitled Document');
    setContent('');
    setCategory(activeCategory);
  };

  const loadTemplate = (type: 'checklist' | 'strategy' | 'review') => {
    setContent(TEMPLATES[type]);
    if (type === 'checklist') {
      setTitle('Daily Pre-Market Checklist');
      setCategory('Checklist');
    } else if (type === 'strategy') {
      setTitle('SMC Strategy Blueprint');
      setCategory('Strategy');
    } else {
      setTitle('Weekly Performance Review');
      setCategory('Review');
    }
  };

  const handleSave = async () => {
    if (!account) return;
    setLoading(true);

    try {
      if (selectedPage) {
        // Update existing page
        const updated = await api.notebook.update(selectedPage.id, {
          title,
          content,
          category,
        });
        setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedPage(updated);
      } else {
        // Create new page
        const created = await api.notebook.create({
          account_id: account.id,
          title,
          content,
          category,
        });
        setPages((prev) => [created, ...prev]);
        setSelectedPage(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert("Error saving note: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPage) return;
    if (!confirm('Delete this document permanently?')) return;

    try {
      await api.notebook.delete(selectedPage.id);
      const remaining = pages.filter((p) => p.id !== selectedPage.id);
      setPages(remaining);
      if (remaining.length) {
        selectPage(remaining[0]);
      } else {
        createNewPage();
      }
    } catch (err: any) {
      alert("Error deleting note: " + err.message);
    }
  };

  const filteredPages = pages.filter((p) => p.category === activeCategory);

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-9rem)]">
        
        {/* Left Column: Pages List */}
        <div className="md:col-span-1 glass-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-bg-border flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Notebooks</span>
            <button
              onClick={createNewPage}
              className="p-1 rounded hover:bg-bg-hover text-primary transition-colors"
              title="New Document"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-4 border-b border-bg-border bg-bg-surface p-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setCategory(cat);
                }}
                className={`py-1.5 text-[10px] font-bold text-center uppercase tracking-wider rounded transition-all ${
                  activeCategory === cat
                    ? 'bg-bg-card text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {cat.slice(0, 4)}
              </button>
            ))}
          </div>

          {/* Documents list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-bg-border/20">
            {filteredPages.length === 0 ? (
              <p className="text-center text-text-subtle text-[11px] py-6">
                No documents found.
              </p>
            ) : (
              filteredPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => selectPage(page)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors text-xs ${
                    selectedPage?.id === page.id
                      ? 'bg-primary-dim border border-primary/20 text-text-primary'
                      : 'hover:bg-bg-hover text-text-muted hover:text-text-primary'
                  }`}
                >
                  <FileText size={14} className="mt-0.5 flex-shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{page.title}</p>
                    <p className="text-[10px] text-text-subtle mt-0.5">
                      {new Date(page.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Editor Workspace */}
        <div className="md:col-span-3 glass-card flex flex-col overflow-hidden">
          {/* Header Toolbar */}
          <div className="p-3 border-b border-bg-border bg-bg-surface flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
            
            {/* Quick Templates */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">Load Template:</span>
              <button onClick={() => loadTemplate('checklist')} className="px-2 py-1 rounded border border-bg-border bg-bg-card hover:bg-bg-hover text-[10px] text-text-muted hover:text-primary transition-all">
                Checklist
              </button>
              <button onClick={() => loadTemplate('strategy')} className="px-2 py-1 rounded border border-bg-border bg-bg-card hover:bg-bg-hover text-[10px] text-text-muted hover:text-primary transition-all">
                Strategy
              </button>
              <button onClick={() => loadTemplate('review')} className="px-2 py-1 rounded border border-bg-border bg-bg-card hover:bg-bg-hover text-[10px] text-text-muted hover:text-primary transition-all">
                Review
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {selectedPage && (
                <button
                  onClick={handleDelete}
                  className="btn-ghost !px-2.5 !py-1.5 text-xs gap-1 hover:text-red-400 hover:border-red-500/20"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary !px-3 !py-1.5 text-xs gap-1"
              >
                {saved ? <CheckCircle size={12} /> : <Save size={12} />}
                {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Page'}
              </button>
            </div>

          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col p-5 space-y-4">
            
            {/* Category selection + Title Input */}
            <div className="flex items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-field !w-32 !py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field !text-base font-bold !py-2.5"
                placeholder="Document Title"
              />
            </div>

            {/* Content Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 input-field font-mono text-xs leading-relaxed p-4 resize-none bg-bg-base/30 border border-bg-border focus:ring-primary/20 focus:border-primary/30"
              placeholder="Start writing notes or check list... (markdown supported in display panels)"
            />

          </div>

        </div>

      </div>
    </AppShell>
  );
}
