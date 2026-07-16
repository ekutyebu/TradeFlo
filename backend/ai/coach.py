"""
TradeFlo AI Coach — Main Orchestrator
Computes full analytics summary and dispatches to the appropriate AI module.
"""
from typing import List, Optional
from datetime import datetime, date
from ai.stats import (
    win_rate, profit_factor, expected_value, max_drawdown,
    sharpe_ratio, kelly_criterion, z_score_streak, win_loss_streaks,
    monte_carlo_drawdown, avg_trade_duration_minutes, mean,
    calculate_edge_score,
)
from ai.patterns import generate_insights
from ai.risk import evaluate_all_risks


def trades_to_dicts(trades) -> List[dict]:
    """Convert SQLAlchemy Trade objects to plain dicts for the AI engine."""
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "side": t.side.value if hasattr(t.side, "value") else t.side,
            "pnl": t.pnl or 0.0,
            "pnl_pct": t.pnl_pct or 0.0,
            "rr_ratio": t.rr_ratio,
            "lot_size": t.lot_size,
            "entry_time": t.entry_time,
            "exit_time": t.exit_time,
            "setup_tag": t.setup_tag,
            "session_id": t.session_id,
            "balance_before": t.balance_before,
            "balance_after": t.balance_after,
        }
        for t in trades
    ]


def sessions_to_dicts(sessions) -> List[dict]:
    """Convert SQLAlchemy Session objects to plain dicts."""
    return [
        {
            "id": s.id,
            "date": s.date,
            "mood": s.mood.value if hasattr(s.mood, "value") else s.mood,
        }
        for s in sessions
    ]


def build_equity_curve(trades_dicts: List[dict], initial_balance: float) -> List[float]:
    """Build equity curve from trades sorted by entry time."""
    sorted_trades = sorted(trades_dicts, key=lambda t: t["entry_time"] or datetime.min)
    curve = [initial_balance]
    for t in sorted_trades:
        curve.append(curve[-1] + (t["pnl"] or 0))
    return curve


def compute_analytics(account, trades, sessions) -> dict:
    """
    Full analytics computation. Returns a dict matching the AnalyticsSummary schema.
    """
    trade_dicts = trades_to_dicts(trades)
    session_dicts = sessions_to_dicts(sessions)
    account_dict = {
        "id": account.id,
        "name": account.name,
        "current_balance": account.current_balance,
        "initial_balance": account.initial_balance,
        "currency": account.currency,
        "max_daily_loss_pct": account.max_daily_loss_pct,
        "max_drawdown_pct": account.max_drawdown_pct,
        "risk_per_trade_pct": account.risk_per_trade_pct,
    }

    closed_trades = [t for t in trade_dicts if t["pnl"] != 0]
    pnl_list = [t["pnl"] for t in closed_trades]

    if not pnl_list:
        return {
            "account_id": account.id,
            "total_trades": 0,
            "win_rate": 0.0, "avg_win": 0.0, "avg_loss": 0.0, "avg_rr": 0.0,
            "profit_factor": 0.0, "expected_value": 0.0,
            "max_drawdown": 0.0, "max_drawdown_pct": 0.0,
            "total_pnl": 0.0, "total_pnl_pct": 0.0,
            "longest_win_streak": 0, "longest_loss_streak": 0,
            "best_trade_pnl": 0.0, "worst_trade_pnl": 0.0,
            "avg_trade_duration_minutes": 0.0,
            "best_setup": None, "best_symbol": None,
            "best_day_of_week": None, "best_session": None,
            "edge_score": 0.0,
        }

    wins = [p for p in pnl_list if p > 0]
    losses = [p for p in pnl_list if p < 0]
    rr_values = [t["rr_ratio"] for t in closed_trades if t["rr_ratio"]]
    equity_curve = build_equity_curve(closed_trades, account.initial_balance)
    dd_abs, dd_pct = max_drawdown(equity_curve)
    win_streak, loss_streak = win_loss_streaks(pnl_list)

    entry_times = [t["entry_time"] for t in closed_trades]
    exit_times = [t["exit_time"] for t in closed_trades]
    duration = avg_trade_duration_minutes(entry_times, exit_times)

    # Pattern analysis for best X
    from ai.patterns import day_of_week_analysis, session_analysis, symbol_analysis, setup_analysis
    dow = day_of_week_analysis(trade_dicts)
    sess = session_analysis(trade_dicts)
    sym = symbol_analysis(trade_dicts)
    setup = setup_analysis(trade_dicts)

    total_pnl = sum(pnl_list)
    total_pnl_pct = total_pnl / account.initial_balance * 100 if account.initial_balance else 0

    # Calculate edge score
    # Check if daily loss was breached today
    today = datetime.utcnow().date()
    today_pnl = sum(t["pnl"] for t in trade_dicts if t["entry_time"] and t["entry_time"].date() == today)
    daily_limit = account.current_balance * (account.max_daily_loss_pct / 100)
    daily_limit_breached = (today_pnl < 0) and (abs(today_pnl) >= daily_limit)

    edge_score_val = calculate_edge_score(
        pnl_list=pnl_list,
        max_dd_pct=dd_pct * 100,
        limit_dd_pct=account.max_drawdown_pct,
        daily_limit_breached=daily_limit_breached
    )

    return {
        "account_id": account.id,
        "total_trades": len(closed_trades),
        "win_rate": win_rate(pnl_list),
        "avg_win": mean(wins) if wins else 0.0,
        "avg_loss": mean(losses) if losses else 0.0,
        "avg_rr": mean(rr_values) if rr_values else 0.0,
        "profit_factor": profit_factor(pnl_list),
        "expected_value": expected_value(pnl_list),
        "max_drawdown": dd_abs,
        "max_drawdown_pct": dd_pct * 100,
        "total_pnl": total_pnl,
        "total_pnl_pct": total_pnl_pct,
        "longest_win_streak": win_streak,
        "longest_loss_streak": loss_streak,
        "best_trade_pnl": max(pnl_list) if pnl_list else 0.0,
        "worst_trade_pnl": min(pnl_list) if pnl_list else 0.0,
        "avg_trade_duration_minutes": duration,
        "best_setup": setup.get("best_setup"),
        "best_symbol": sym.get("best_symbol"),
        "best_day_of_week": dow.get("best_day"),
        "best_session": sess.get("best_session"),
        "edge_score": edge_score_val,
    }


def build_ai_context(account, analytics: dict, trades, sessions) -> dict:
    """Build context dict to pass to the chat engine."""
    trade_dicts = trades_to_dicts(trades)
    session_dicts = sessions_to_dicts(sessions)
    account_dict = {
        "id": account.id,
        "name": account.name,
        "current_balance": account.current_balance,
        "currency": account.currency,
        "max_daily_loss_pct": account.max_daily_loss_pct,
        "max_drawdown_pct": account.max_drawdown_pct,
        "risk_per_trade_pct": account.risk_per_trade_pct,
    }

    insights = generate_insights(trade_dicts, session_dicts, account_dict)
    equity_curve = build_equity_curve(trade_dicts, account.initial_balance)
    today = datetime.utcnow().date()
    trades_today = [t for t in trade_dicts if t["entry_time"] and t["entry_time"].date() == today]
    risk_alerts = evaluate_all_risks(account_dict, trades_today, trade_dicts, equity_curve)

    return {
        "account": account_dict,
        "stats": analytics,
        "insights": insights,
        "alerts": risk_alerts,
    }
