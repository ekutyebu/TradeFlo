'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { api, type Account, type ChatMessage } from '@/lib/api';
import { Send, Bot, User, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

const STARTER_PROMPTS = [
  "Review my trading performance",
  "What's my win rate?",
  "How should I manage my risk?",
  "I'm struggling after consecutive losses",
  "What are my best trading hours?",
  "Analyze my biggest mistakes",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary-dim border border-primary/20 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-primary" />
      </div>
      <div className="chat-bubble-ai flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// Simple markdown renderer for AI responses
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-text-primary text-sm mt-2">{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-text-primary">{line.slice(2)}</h2>;
        if (line.startsWith('- ')) return (
          <div key={i} className="flex gap-2 text-xs">
            <span className="text-primary mt-1 flex-shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
          </div>
        );
        if (line.startsWith('| ')) return <div key={i} className="text-xs font-mono text-text-muted">{line}</div>;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
      })}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-text-muted">$1</em>')
    .replace(/`(.*?)`/g, '<code class="text-primary bg-bg-base px-1 rounded text-xs">$1</code>');
}

export default function AiCoachPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      const accounts = await api.accounts.list().catch(() => []);
      if (accounts.length) {
        setAccount(accounts[0]);
        const history = await api.ai.history(accounts[0].id).catch(() => []);
        setMessages(history);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    setInput('');
    setIsTyping(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      account_id: account?.id,
      role: 'user',
      content: text,
      context_type: 'general',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.ai.chat({
        content: text,
        account_id: account?.id,
        context_type: 'general',
      });
      // Replace temp message with real ones
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.user_message,
        response.assistant_message,
      ]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Make sure the backend is running on port 8000.',
        context_type: 'error',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [account, isTyping]);

  const clearHistory = async () => {
    if (!confirm('Clear all chat history?')) return;
    await api.ai.history().then(() => {}).catch(() => {});
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <AppShell accountName={account?.name} balance={account?.current_balance} currency={account?.currency}>
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-dim border border-primary/20 flex items-center justify-center" style={{ boxShadow: '0 0 16px rgba(16,185,129,0.2)' }}>
              <Sparkles size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="section-title">FloAI — AI Coach</h2>
              <p className="text-xs text-text-muted">Ask anything about your trading performance</p>
            </div>
          </div>
          <button onClick={clearHistory} className="btn-ghost text-xs gap-1.5">
            <Trash2 size={12} />
            Clear history
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && !loading && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-dim border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="chat-bubble-ai">
                    <MarkdownText text={`Hey ${account?.name || 'Trader'}! 👋 I'm FloAI, your TradeFlo AI Coach.\n\nI have access to your full trade journal and can help you:\n- **Analyse** your performance and find patterns\n- **Review** your risk management\n- **Counsel** you on trading psychology\n- **Answer** any trading questions\n\nWhat would you like to explore today?`} />
                  </div>
                </div>

                {/* Starter prompts */}
                <div className="flex flex-wrap gap-2 ml-9">
                  {STARTER_PROMPTS.map((prompt) => (
                    <motion.button
                      key={prompt}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => sendMessage(prompt)}
                      className="px-3 py-1.5 rounded-full text-xs border border-bg-border bg-bg-surface text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary-dim transition-all duration-200"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={clsx('flex items-end gap-2', msg.role === 'user' && 'flex-row-reverse')}
                >
                  {/* Avatar */}
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    msg.role === 'assistant' ? 'bg-primary-dim border border-primary/20' : 'bg-bg-hover border border-bg-border'
                  )}>
                    {msg.role === 'assistant'
                      ? <Bot size={14} className="text-primary" />
                      : <User size={14} className="text-text-muted" />
                    }
                  </div>

                  {/* Bubble */}
                  {msg.role === 'assistant' ? (
                    <div className="chat-bubble-ai">
                      <MarkdownText text={msg.content} />
                      <p className="text-[10px] text-text-muted mt-2">
                        {format(parseISO(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                  ) : (
                    <div className="chat-bubble-user">
                      <p>{msg.content}</p>
                      <p className="text-[10px] opacity-70 mt-1 text-right">
                        {format(parseISO(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <TypingIndicator />
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-bg-border p-4 flex-shrink-0">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask FloAI anything… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="flex-1 input-field resize-none min-h-[40px] max-h-[120px]"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="btn-primary !px-3 !py-3 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
