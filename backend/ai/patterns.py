"""
TradeFlo Pattern Detection — Pure Python
Detects trading patterns from journal data without external ML libraries.
"""
from typing import List, Dict, Optional, Any
from datetime import datetime
from collections import defaultdict
from ai.stats import mean, win_rate, expected_value


DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

SESSIONS = {
    "Asian":    (0, 8),    # UTC hours
    "London":   (7, 16),
    "New York": (12, 21),
    "Overlap":  (12, 16),
}


def _get_session(hour_utc: int) -> str:
    """Map UTC hour to trading session name."""
    if 12 <= hour_utc < 16:
        return "Overlap"
    if 7 <= hour_utc < 16:
        return "London"
    if 12 <= hour_utc < 21:
        return "New York"
    return "Asian"


def day_of_week_analysis(trades: List[dict]) -> Dict[str, Any]:
    """
    Group trades by day of week. Find best and worst performing days.
    trades: list of dicts with keys 'entry_time' (datetime) and 'pnl' (float).
    """
    day_pnls: Dict[str, List[float]] = defaultdict(list)
    for t in trades:
        if t.get("entry_time") and t.get("pnl") is not None:
            day_name = DAYS_OF_WEEK[t["entry_time"].weekday()]
            day_pnls[day_name].append(t["pnl"])

    results = {}
    for day, pnls in day_pnls.items():
        results[day] = {
            "total_pnl": sum(pnls),
            "win_rate": win_rate(pnls),
            "trade_count": len(pnls),
            "avg_pnl": mean(pnls),
            "ev": expected_value(pnls),
        }

    best_day = max(results, key=lambda d: results[d]["ev"]) if results else None
    worst_day = min(results, key=lambda d: results[d]["ev"]) if results else None

    return {"by_day": results, "best_day": best_day, "worst_day": worst_day}


def session_analysis(trades: List[dict]) -> Dict[str, Any]:
    """
    Group trades by trading session (Asian, London, NY, Overlap).
    """
    session_pnls: Dict[str, List[float]] = defaultdict(list)
    for t in trades:
        if t.get("entry_time") and t.get("pnl") is not None:
            hour = t["entry_time"].hour
            session = _get_session(hour)
            session_pnls[session].append(t["pnl"])

    results = {}
    for session, pnls in session_pnls.items():
        results[session] = {
            "total_pnl": sum(pnls),
            "win_rate": win_rate(pnls),
            "trade_count": len(pnls),
            "avg_pnl": mean(pnls),
            "ev": expected_value(pnls),
        }

    best_session = max(results, key=lambda s: results[s]["ev"]) if results else None
    return {"by_session": results, "best_session": best_session}


def symbol_analysis(trades: List[dict]) -> Dict[str, Any]:
    """Group trades by symbol, find best-performing pair."""
    symbol_pnls: Dict[str, List[float]] = defaultdict(list)
    for t in trades:
        if t.get("symbol") and t.get("pnl") is not None:
            symbol_pnls[t["symbol"]].append(t["pnl"])

    results = {}
    for symbol, pnls in symbol_pnls.items():
        results[symbol] = {
            "total_pnl": sum(pnls),
            "win_rate": win_rate(pnls),
            "trade_count": len(pnls),
            "avg_pnl": mean(pnls),
            "ev": expected_value(pnls),
        }

    best_symbol = max(results, key=lambda s: results[s]["ev"]) if results else None
    worst_symbol = min(results, key=lambda s: results[s]["ev"]) if results else None
    return {"by_symbol": results, "best_symbol": best_symbol, "worst_symbol": worst_symbol}


def setup_analysis(trades: List[dict]) -> Dict[str, Any]:
    """Group trades by setup tag."""
    setup_pnls: Dict[str, List[float]] = defaultdict(list)
    for t in trades:
        tag = t.get("setup_tag") or "Untagged"
        if t.get("pnl") is not None:
            setup_pnls[tag].append(t["pnl"])

    results = {}
    for setup, pnls in setup_pnls.items():
        results[setup] = {
            "total_pnl": sum(pnls),
            "win_rate": win_rate(pnls),
            "trade_count": len(pnls),
            "avg_pnl": mean(pnls),
            "ev": expected_value(pnls),
        }

    best_setup = max(results, key=lambda s: results[s]["ev"]) if results else None
    return {"by_setup": results, "best_setup": best_setup}


def overtrading_detector(trades: List[dict]) -> List[dict]:
    """
    Detect days where trade count exceeds a threshold (> 5 trades/day).
    High trade count on losing days is a key overtrading signal.
    """
    day_trades: Dict[str, List[dict]] = defaultdict(list)
    for t in trades:
        if t.get("entry_time"):
            day_key = t["entry_time"].strftime("%Y-%m-%d")
            day_trades[day_key].append(t)

    alerts = []
    for day, day_t in day_trades.items():
        if len(day_t) > 5:
            day_pnl = sum(t.get("pnl", 0) for t in day_t)
            alerts.append({
                "date": day,
                "trade_count": len(day_t),
                "day_pnl": day_pnl,
                "severity": "HIGH" if day_pnl < 0 else "MODERATE",
            })
    return sorted(alerts, key=lambda x: x["trade_count"], reverse=True)


def revenge_trading_detector(trades: List[dict]) -> List[dict]:
    """
    Detect revenge trading: a losing trade followed within 15 minutes by
    a new trade in the opposite direction with larger size.
    """
    alerts = []
    sorted_trades = sorted(trades, key=lambda t: t.get("entry_time") or datetime.min)

    for i in range(1, len(sorted_trades)):
        prev = sorted_trades[i - 1]
        curr = sorted_trades[i]
        if not prev.get("entry_time") or not curr.get("entry_time"):
            continue
        time_gap = (curr["entry_time"] - prev["entry_time"]).total_seconds() / 60
        is_loss = (prev.get("pnl") or 0) < 0
        is_opposite = prev.get("side") != curr.get("side")
        is_larger = (curr.get("lot_size") or 0) > (prev.get("lot_size") or 0)
        is_quick = time_gap < 15

        if is_loss and is_opposite and is_larger and is_quick:
            alerts.append({
                "trigger_trade_id": prev.get("id"),
                "revenge_trade_id": curr.get("id"),
                "time_gap_minutes": round(time_gap, 1),
                "loss_amount": prev.get("pnl"),
                "increased_size_by": round(
                    (curr.get("lot_size", 0) / max(prev.get("lot_size", 1), 0.001) - 1) * 100, 1
                ),
            })
    return alerts


def mood_performance_correlation(sessions: List[dict], trades: List[dict]) -> Dict[str, Any]:
    """
    Correlate session mood with trading performance.
    """
    session_map = {s["id"]: s for s in sessions}
    mood_pnls: Dict[str, List[float]] = defaultdict(list)

    for t in trades:
        session_id = t.get("session_id")
        if session_id and session_id in session_map:
            mood = session_map[session_id].get("mood", "NEUTRAL")
            if t.get("pnl") is not None:
                mood_pnls[mood].append(t["pnl"])

    results = {}
    for mood, pnls in mood_pnls.items():
        results[mood] = {
            "avg_pnl": mean(pnls),
            "win_rate": win_rate(pnls),
            "trade_count": len(pnls),
        }

    best_mood = max(results, key=lambda m: results[m]["avg_pnl"]) if results else None
    return {"by_mood": results, "best_mood": best_mood}


def generate_insights(
    trades: List[dict],
    sessions: List[dict],
    account: dict,
) -> List[dict]:
    """
    Main entry point: run all pattern detectors and return a list of insights.
    Each insight has: category, insight (text), confidence, data.
    """
    insights = []

    if not trades:
        return [{"category": "general", "insight": "No trades logged yet. Start journaling to unlock AI insights.", "confidence": 1.0, "data": {}}]

    pnl_list = [t.get("pnl", 0) for t in trades]
    wr = win_rate(pnl_list)

    # Day-of-week insight
    dow = day_of_week_analysis(trades)
    if dow["best_day"] and dow["worst_day"]:
        best = dow["by_day"][dow["best_day"]]
        worst = dow["by_day"][dow["worst_day"]]
        insights.append({
            "category": "timing",
            "insight": f"Your strongest day is {dow['best_day']} ({best['win_rate']*100:.0f}% win rate). "
                       f"Consider reducing exposure on {dow['worst_day']} ({worst['win_rate']*100:.0f}% win rate).",
            "confidence": min(0.6 + best["trade_count"] * 0.02, 0.95),
            "data": dow,
        })

    # Session insight
    sess = session_analysis(trades)
    if sess["best_session"]:
        best_s = sess["by_session"][sess["best_session"]]
        insights.append({
            "category": "session",
            "insight": f"You perform best during the {sess['best_session']} session "
                       f"(EV: {best_s['ev']:.2f} per trade). Focus your trading here.",
            "confidence": min(0.5 + best_s["trade_count"] * 0.03, 0.90),
            "data": sess,
        })

    # Symbol insight
    syms = symbol_analysis(trades)
    if syms["best_symbol"]:
        insights.append({
            "category": "instrument",
            "insight": f"Your edge is strongest on {syms['best_symbol']} "
                       f"(win rate: {syms['by_symbol'][syms['best_symbol']]['win_rate']*100:.0f}%).",
            "confidence": 0.80,
            "data": syms,
        })

    # Overtrading
    ot = overtrading_detector(trades)
    if ot:
        insights.append({
            "category": "discipline",
            "insight": f"Overtrading detected on {len(ot)} day(s). "
                       f"Your worst day had {ot[0]['trade_count']} trades with {ot[0]['day_pnl']:.2f} PnL.",
            "confidence": 0.90,
            "data": {"overtrading_days": ot[:3]},
        })

    # Revenge trading
    rt = revenge_trading_detector(trades)
    if rt:
        insights.append({
            "category": "psychology",
            "insight": f"Potential revenge trading detected in {len(rt)} instance(s). "
                       f"You increased position size after losses within 15 minutes.",
            "confidence": 0.85,
            "data": {"incidents": rt[:3]},
        })

    # Win rate assessment
    if wr < 0.4:
        insights.append({
            "category": "performance",
            "insight": f"Your win rate is {wr*100:.1f}%. With a positive RR ratio this can still be profitable, "
                       f"but review your entries — you may be entering too early or in low-probability zones.",
            "confidence": 0.88,
            "data": {"win_rate": wr},
        })
    elif wr > 0.70:
        insights.append({
            "category": "performance",
            "insight": f"Excellent win rate of {wr*100:.1f}%! Ensure your RR ratio isn't being compromised "
                       f"(moving stops, cutting wins early) to achieve this.",
            "confidence": 0.80,
            "data": {"win_rate": wr},
        })

    return insights
