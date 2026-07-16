from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class TradeSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class TradeStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class SessionMood(str, enum.Enum):
    FOCUSED = "FOCUSED"
    NERVOUS = "NERVOUS"
    CONFIDENT = "CONFIDENT"
    TIRED = "TIRED"
    NEUTRAL = "NEUTRAL"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    broker = Column(String(100))
    account_number = Column(String(100))
    currency = Column(String(10), default="USD")
    initial_balance = Column(Float, nullable=False)
    current_balance = Column(Float, nullable=False)
    max_daily_loss_pct = Column(Float, default=2.0)   # % of balance
    max_drawdown_pct = Column(Float, default=5.0)     # % of balance
    risk_per_trade_pct = Column(Float, default=1.0)   # % of balance
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    trades = relationship("Trade", back_populates="account", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="account", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    mood = Column(SAEnum(SessionMood), default=SessionMood.NEUTRAL)
    pre_session_notes = Column(Text)
    post_session_notes = Column(Text)
    planned_pairs = Column(String(500))  # comma-separated
    session_pnl = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    account = relationship("Account", back_populates="sessions")
    trades = relationship("Trade", back_populates="session")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)

    symbol = Column(String(20), nullable=False)
    side = Column(SAEnum(TradeSide), nullable=False)
    status = Column(SAEnum(TradeStatus), default=TradeStatus.CLOSED)

    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    lot_size = Column(Float, nullable=False)

    pnl = Column(Float, default=0.0)           # Realized P&L in account currency
    pnl_pct = Column(Float, default=0.0)       # P&L as % of balance at entry
    rr_ratio = Column(Float, nullable=True)    # Actual realized R:R
    planned_rr = Column(Float, nullable=True)  # Planned R:R before entry

    entry_time = Column(DateTime(timezone=True), nullable=False)
    exit_time = Column(DateTime(timezone=True), nullable=True)

    setup_tag = Column(String(100))    # e.g. "Break of Structure", "FVG", "OB"
    confluence = Column(Text)          # What confluences were present
    mistakes = Column(Text)            # What went wrong
    notes = Column(Text)
    screenshot_url = Column(String(500))

    balance_before = Column(Float)     # Account balance before this trade
    balance_after = Column(Float)      # Account balance after this trade

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="trades")
    session = relationship("Session", back_populates="trades")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    role = Column(String(20), nullable=False)      # "user" or "assistant"
    content = Column(Text, nullable=False)
    context_type = Column(String(50), default="general")  # "review", "counseling", "risk", "general"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NotebookPage(Base):
    __tablename__ = "notebook_pages"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="Strategy")  # Strategy, Checklist, Rules, Review
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    strategy_name = Column(String(200), nullable=False)
    symbol = Column(String(20), nullable=False)
    timeframe = Column(String(20), nullable=False)
    trades_count = Column(Integer, nullable=False)
    wins = Column(Integer, nullable=False)
    losses = Column(Integer, nullable=False)
    total_pnl = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

