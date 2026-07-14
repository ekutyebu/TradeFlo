/**
 * TradeFlo API Client
 * Centralised fetch wrapper for all backend calls.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Accounts ────────────────────────────────────────────────────────────────
export const api = {
  accounts: {
    list: () => request<Account[]>('/api/accounts/'),
    get: (id: number) => request<Account>(`/api/accounts/${id}`),
    create: (data: Partial<Account>) =>
      request<Account>('/api/accounts/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Account>) =>
      request<Account>(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  trades: {
    list: (params?: { account_id?: number; symbol?: string; limit?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<Trade[]>(`/api/trades/${qs ? '?' + qs : ''}`);
    },
    get: (id: number) => request<Trade>(`/api/trades/${id}`),
    create: (data: Partial<Trade>) =>
      request<Trade>('/api/trades/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Trade>) =>
      request<Trade>(`/api/trades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/api/trades/${id}`, { method: 'DELETE' }),
  },

  sessions: {
    list: (account_id: number) => request<TradingSession[]>(`/api/sessions/?account_id=${account_id}`),
    create: (data: Partial<TradingSession>) =>
      request<TradingSession>('/api/sessions/', { method: 'POST', body: JSON.stringify(data) }),
  },

  analytics: {
    summary: (accountId: number) =>
      request<AnalyticsSummary>(`/api/analytics/${accountId}/summary`),
    equityCurve: (accountId: number) =>
      request<EquityCurveResponse>(`/api/analytics/${accountId}/equity-curve`),
    insights: (accountId: number) =>
      request<{ insights: PatternInsight[] }>(`/api/analytics/${accountId}/insights`),
    riskAlerts: (accountId: number) =>
      request<{ alerts: RiskAlert[] }>(`/api/analytics/${accountId}/risk-alerts`),
    positionSize: (accountId: number, stopLossPips: number, pipValue?: number) =>
      request<PositionSizeResponse>(
        `/api/analytics/position-size?account_id=${accountId}&stop_loss_pips=${stopLossPips}&pip_value=${pipValue || 10}`
      ),
  },

  ai: {
    chat: (data: { content: string; account_id?: number; context_type?: string }) =>
      request<ChatResponse>('/api/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
    history: (account_id?: number) =>
      request<ChatMessage[]>(`/api/ai/history${account_id ? '?account_id=' + account_id : ''}`),
  },

  market: {
    price: (symbol: string) => request<MarketPrice>(`/api/market/price/${symbol}`),
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Account {
  id: number;
  name: string;
  broker?: string;
  account_number?: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  max_daily_loss_pct: number;
  max_drawdown_pct: number;
  risk_per_trade_pct: number;
  is_active: boolean;
  created_at: string;
}

export interface Trade {
  id: number;
  account_id: number;
  session_id?: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  lot_size: number;
  pnl: number;
  pnl_pct: number;
  rr_ratio?: number;
  planned_rr?: number;
  entry_time: string;
  exit_time?: string;
  setup_tag?: string;
  confluence?: string;
  mistakes?: string;
  notes?: string;
  balance_before?: number;
  balance_after?: number;
  created_at: string;
}

export interface TradingSession {
  id: number;
  account_id: number;
  date: string;
  mood: string;
  pre_session_notes?: string;
  post_session_notes?: string;
  planned_pairs?: string;
  session_pnl: number;
  created_at: string;
}

export interface AnalyticsSummary {
  account_id: number;
  total_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  avg_rr: number;
  profit_factor: number;
  expected_value: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  total_pnl: number;
  total_pnl_pct: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  best_trade_pnl: number;
  worst_trade_pnl: number;
  avg_trade_duration_minutes: number;
  best_setup?: string;
  best_symbol?: string;
  best_day_of_week?: string;
  best_session?: string;
}

export interface EquityPoint {
  timestamp: string;
  balance: number;
  trade_id: number;
  pnl: number;
}

export interface EquityCurveResponse {
  account_id: number;
  initial_balance: number;
  points: EquityPoint[];
}

export interface PatternInsight {
  category: string;
  insight: string;
  confidence: number;
  data: Record<string, unknown>;
}

export interface RiskAlert {
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  rule: string;
  message: string;
  value: number;
  limit: number;
}

export interface PositionSizeResponse {
  recommended_lot_size: number;
  risk_amount: number;
  risk_pct: number;
  stop_loss_pips: number;
  pip_value: number;
}

export interface ChatMessage {
  id: number;
  account_id?: number;
  role: 'user' | 'assistant';
  content: string;
  context_type: string;
  created_at: string;
}

export interface ChatResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface MarketPrice {
  symbol: string;
  bid: number;
  ask: number;
  source: string;
}
