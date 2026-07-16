from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class TradeSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class TradeStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class SessionMood(str, Enum):
    FOCUSED = "FOCUSED"
    NERVOUS = "NERVOUS"
    CONFIDENT = "CONFIDENT"
    TIRED = "TIRED"
    NEUTRAL = "NEUTRAL"


# ─── Account Schemas ───────────────────────────────────────────────────────────

class AccountCreate(BaseModel):
    name: str
    broker: Optional[str] = None
    account_number: Optional[str] = None
    currency: str = "USD"
    initial_balance: float
    max_daily_loss_pct: float = 2.0
    max_drawdown_pct: float = 5.0
    risk_per_trade_pct: float = 1.0

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    broker: Optional[str] = None
    current_balance: Optional[float] = None
    max_daily_loss_pct: Optional[float] = None
    max_drawdown_pct: Optional[float] = None
    risk_per_trade_pct: Optional[float] = None

class AccountResponse(BaseModel):
    id: int
    name: str
    broker: Optional[str]
    account_number: Optional[str]
    currency: str
    initial_balance: float
    current_balance: float
    max_daily_loss_pct: float
    max_drawdown_pct: float
    risk_per_trade_pct: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Session Schemas ───────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    account_id: int
    date: datetime
    mood: SessionMood = SessionMood.NEUTRAL
    pre_session_notes: Optional[str] = None
    post_session_notes: Optional[str] = None
    planned_pairs: Optional[str] = None

class SessionResponse(BaseModel):
    id: int
    account_id: int
    date: datetime
    mood: SessionMood
    pre_session_notes: Optional[str]
    post_session_notes: Optional[str]
    planned_pairs: Optional[str]
    session_pnl: float
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Trade Schemas ─────────────────────────────────────────────────────────────

class TradeCreate(BaseModel):
    account_id: int
    session_id: Optional[int] = None
    symbol: str
    side: TradeSide
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    lot_size: float
    pnl: float = 0.0
    pnl_pct: float = 0.0
    rr_ratio: Optional[float] = None
    planned_rr: Optional[float] = None
    entry_time: datetime
    exit_time: Optional[datetime] = None
    status: TradeStatus = TradeStatus.CLOSED
    setup_tag: Optional[str] = None
    confluence: Optional[str] = None
    mistakes: Optional[str] = None
    notes: Optional[str] = None
    screenshot_url: Optional[str] = None
    balance_before: Optional[float] = None
    balance_after: Optional[float] = None

class TradeUpdate(BaseModel):
    exit_price: Optional[float] = None
    exit_time: Optional[datetime] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    rr_ratio: Optional[float] = None
    status: Optional[TradeStatus] = None
    setup_tag: Optional[str] = None
    confluence: Optional[str] = None
    mistakes: Optional[str] = None
    notes: Optional[str] = None
    screenshot_url: Optional[str] = None
    balance_after: Optional[float] = None

class TradeResponse(BaseModel):
    id: int
    account_id: int
    session_id: Optional[int]
    symbol: str
    side: TradeSide
    status: TradeStatus
    entry_price: float
    exit_price: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    lot_size: float
    pnl: float
    pnl_pct: float
    rr_ratio: Optional[float]
    planned_rr: Optional[float]
    entry_time: datetime
    exit_time: Optional[datetime]
    setup_tag: Optional[str]
    confluence: Optional[str]
    mistakes: Optional[str]
    notes: Optional[str]
    balance_before: Optional[float]
    balance_after: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Analytics Schemas ─────────────────────────────────────────────────────────

class EquityPoint(BaseModel):
    timestamp: datetime
    balance: float
    trade_id: int
    pnl: float

class AnalyticsSummary(BaseModel):
    account_id: int
    total_trades: int
    win_rate: float              # 0.0 – 1.0
    avg_win: float
    avg_loss: float
    avg_rr: float
    profit_factor: float         # gross_profit / gross_loss
    expected_value: float        # EV per trade in currency
    max_drawdown: float          # max peak-to-trough in currency
    max_drawdown_pct: float      # as % of peak balance
    total_pnl: float
    total_pnl_pct: float
    longest_win_streak: int
    longest_loss_streak: int
    best_trade_pnl: float
    worst_trade_pnl: float
    avg_trade_duration_minutes: float
    best_setup: Optional[str]
    best_symbol: Optional[str]
    best_day_of_week: Optional[str]
    best_session: Optional[str]
    edge_score: float

class PatternInsight(BaseModel):
    category: str
    insight: str
    confidence: float   # 0.0 – 1.0
    data: dict


# ─── Chat Schemas ──────────────────────────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    content: str
    account_id: Optional[int] = None
    context_type: str = "general"

class ChatMessageResponse(BaseModel):
    id: int
    account_id: Optional[int]
    role: str
    content: str
    context_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


# ─── Market Data ───────────────────────────────────────────────────────────────

class MarketTick(BaseModel):
    symbol: str
    bid: float
    ask: float
    spread: float
    timestamp: datetime

class MT5OrderRequest(BaseModel):
    account_id: int
    symbol: str
    side: TradeSide
    lot_size: float
    order_type: str = "MARKET"  # MARKET, LIMIT, STOP
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    comment: Optional[str] = "TradeFlo"


# ─── Notebook Schemas ──────────────────────────────────────────────────────────

class NotebookPageCreate(BaseModel):
    account_id: int
    title: str
    content: str
    category: str = "Strategy"

class NotebookPageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None

class NotebookPageResponse(BaseModel):
    id: int
    account_id: int
    title: str
    content: str
    category: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Backtest Schemas ──────────────────────────────────────────────────────────

class BacktestRunCreate(BaseModel):
    account_id: int
    strategy_name: str
    symbol: str
    timeframe: str
    trades_count: int
    wins: int
    losses: int
    total_pnl: float = 0.0
    notes: Optional[str] = None

class BacktestRunResponse(BaseModel):
    id: int
    account_id: int
    strategy_name: str
    symbol: str
    timeframe: str
    trades_count: int
    wins: int
    losses: int
    total_pnl: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

