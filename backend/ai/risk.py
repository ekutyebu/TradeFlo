"""
TradeFlo Risk Management Rules Engine — Pure Python
Enforces risk rules and generates alerts based on account limits.
"""
from typing import List, Dict, Optional
from datetime import datetime, date


class RiskAlert:
    def __init__(self, level: str, rule: str, message: str, value: float, limit: float):
        self.level = level      # "CRITICAL", "WARNING", "INFO"
        self.rule = rule
        self.message = message
        self.value = value
        self.limit = limit

    def to_dict(self) -> dict:
        return {
            "level": self.level,
            "rule": self.rule,
            "message": self.message,
            "value": self.value,
            "limit": self.limit,
        }


def check_daily_loss_limit(
    today_pnl: float,
    account_balance: float,
    max_daily_loss_pct: float,
) -> Optional[RiskAlert]:
    """Check if daily loss limit has been hit or is close."""
    limit = account_balance * (max_daily_loss_pct / 100)
    loss = abs(min(today_pnl, 0))

    if loss >= limit:
        return RiskAlert(
            level="CRITICAL",
            rule="daily_loss_limit",
            message=f"🚨 Daily loss limit BREACHED! Lost {loss:.2f} of {limit:.2f} allowed. STOP TRADING TODAY.",
            value=loss,
            limit=limit,
        )
    elif loss >= limit * 0.75:
        return RiskAlert(
            level="WARNING",
            rule="daily_loss_limit",
            message=f"⚠️ Approaching daily loss limit. Lost {loss:.2f} of {limit:.2f} allowed ({loss/limit*100:.0f}%).",
            value=loss,
            limit=limit,
        )
    return None


def check_max_drawdown(
    current_balance: float,
    peak_balance: float,
    max_drawdown_pct: float,
) -> Optional[RiskAlert]:
    """Check if overall drawdown limit has been hit."""
    if peak_balance <= 0:
        return None
    current_dd_pct = (peak_balance - current_balance) / peak_balance * 100
    limit = max_drawdown_pct

    if current_dd_pct >= limit:
        return RiskAlert(
            level="CRITICAL",
            rule="max_drawdown",
            message=f"🚨 Max drawdown BREACHED! Currently at {current_dd_pct:.1f}% drawdown (limit: {limit:.1f}%). PAUSE TRADING.",
            value=current_dd_pct,
            limit=limit,
        )
    elif current_dd_pct >= limit * 0.75:
        return RiskAlert(
            level="WARNING",
            rule="max_drawdown",
            message=f"⚠️ Approaching max drawdown. Currently at {current_dd_pct:.1f}% (limit: {limit:.1f}%).",
            value=current_dd_pct,
            limit=limit,
        )
    return None


def check_position_size(
    lot_size: float,
    account_balance: float,
    risk_per_trade_pct: float,
    stop_loss_pips: Optional[float] = None,
    pip_value: float = 10.0,
) -> Optional[RiskAlert]:
    """
    Check if a proposed position size respects the risk-per-trade rule.
    Uses stop-loss distance if available, otherwise estimates from lot size.
    """
    max_risk = account_balance * (risk_per_trade_pct / 100)
    if stop_loss_pips and stop_loss_pips > 0:
        estimated_risk = lot_size * stop_loss_pips * pip_value
        if estimated_risk > max_risk * 1.1:  # 10% tolerance
            return RiskAlert(
                level="WARNING",
                rule="position_size",
                message=f"Position risk {estimated_risk:.2f} exceeds {risk_per_trade_pct}% rule ({max_risk:.2f}). Reduce size.",
                value=estimated_risk,
                limit=max_risk,
            )
    return None


def check_loss_streak(pnl_list: List[float], threshold: int = 3) -> Optional[RiskAlert]:
    """Alert on consecutive losing trades."""
    if not pnl_list:
        return None
    streak = 0
    for p in reversed(pnl_list):
        if p < 0:
            streak += 1
        else:
            break
    if streak >= threshold:
        return RiskAlert(
            level="WARNING",
            rule="loss_streak",
            message=f"⚠️ {streak} consecutive losing trades. Consider stepping away and reviewing your setup criteria.",
            value=streak,
            limit=threshold,
        )
    return None


def check_consistency(pnl_list: List[float]) -> Optional[RiskAlert]:
    """
    Detect high variance in trade outcomes — inconsistent sizing or random entries.
    Uses coefficient of variation (CV = std_dev / mean).
    """
    if len(pnl_list) < 5:
        return None
    from ai.stats import mean as calc_mean, std_dev
    m = calc_mean(pnl_list)
    sd = std_dev(pnl_list)
    if m == 0:
        return None
    cv = abs(sd / m)
    if cv > 3.0:
        return RiskAlert(
            level="INFO",
            rule="consistency",
            message=f"High variability in trade outcomes (CV: {cv:.1f}). This suggests inconsistent position sizing or setup quality.",
            value=cv,
            limit=3.0,
        )
    return None


def evaluate_all_risks(
    account: dict,
    trades_today: List[dict],
    all_trades: List[dict],
    equity_curve: List[float],
) -> List[dict]:
    """
    Run all risk checks and return list of alerts.
    """
    alerts = []

    today_pnl = sum(t.get("pnl", 0) for t in trades_today)
    alert = check_daily_loss_limit(today_pnl, account["current_balance"], account["max_daily_loss_pct"])
    if alert:
        alerts.append(alert.to_dict())

    if equity_curve:
        peak = max(equity_curve)
        alert = check_max_drawdown(account["current_balance"], peak, account["max_drawdown_pct"])
        if alert:
            alerts.append(alert.to_dict())

    all_pnls = [t.get("pnl", 0) for t in all_trades]
    streak_alert = check_loss_streak(all_pnls)
    if streak_alert:
        alerts.append(streak_alert.to_dict())

    consistency_alert = check_consistency(all_pnls)
    if consistency_alert:
        alerts.append(consistency_alert.to_dict())

    return alerts


def calculate_position_size(
    account_balance: float,
    risk_pct: float,
    stop_loss_pips: float,
    pip_value: float = 10.0,
) -> float:
    """
    Calculate recommended lot size based on risk parameters.
    lot_size = (account_balance × risk_pct) / (stop_loss_pips × pip_value)
    """
    if stop_loss_pips <= 0 or pip_value <= 0:
        return 0.0
    risk_amount = account_balance * (risk_pct / 100)
    lot_size = risk_amount / (stop_loss_pips * pip_value)
    return round(lot_size, 2)
