"""
TradeFlo AI Engine — Pure Python Statistical Calculations
No ML frameworks. All math built from scratch.
"""
from typing import List, Optional, Tuple
import math


# ─── Basic Stats ───────────────────────────────────────────────────────────────

def mean(values: List[float]) -> float:
    """Arithmetic mean."""
    if not values:
        return 0.0
    return sum(values) / len(values)


def std_dev(values: List[float]) -> float:
    """Population standard deviation."""
    if len(values) < 2:
        return 0.0
    m = mean(values)
    variance = sum((x - m) ** 2 for x in values) / len(values)
    return math.sqrt(variance)


def median(values: List[float]) -> float:
    """Median value."""
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    mid = n // 2
    if n % 2 == 0:
        return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0
    return float(sorted_vals[mid])


# ─── Trading-Specific Stats ────────────────────────────────────────────────────

def win_rate(pnl_list: List[float]) -> float:
    """
    Win rate: proportion of winning trades.
    Returns value between 0.0 and 1.0.
    """
    if not pnl_list:
        return 0.0
    wins = sum(1 for p in pnl_list if p > 0)
    return wins / len(pnl_list)


def profit_factor(pnl_list: List[float]) -> float:
    """
    Profit Factor = Gross Profit / Gross Loss.
    > 1.5 is good, > 2.0 is excellent.
    Returns infinity if no losing trades.
    """
    gross_profit = sum(p for p in pnl_list if p > 0)
    gross_loss = abs(sum(p for p in pnl_list if p < 0))
    if gross_loss == 0:
        return float("inf") if gross_profit > 0 else 0.0
    return gross_profit / gross_loss


def expected_value(pnl_list: List[float]) -> float:
    """
    Expected Value (EV) per trade.
    EV = (win_rate × avg_win) - (loss_rate × avg_loss)
    Positive EV = edge in the market.
    """
    if not pnl_list:
        return 0.0
    wins = [p for p in pnl_list if p > 0]
    losses = [p for p in pnl_list if p < 0]
    wr = win_rate(pnl_list)
    lr = 1 - wr
    avg_win = mean(wins) if wins else 0.0
    avg_loss = mean(losses) if losses else 0.0
    return (wr * avg_win) + (lr * avg_loss)


def max_drawdown(equity_curve: List[float]) -> Tuple[float, float]:
    """
    Maximum drawdown from a list of equity values.
    Returns (absolute_drawdown, percentage_drawdown).
    """
    if not equity_curve:
        return 0.0, 0.0
    peak = equity_curve[0]
    max_dd = 0.0
    max_dd_pct = 0.0
    for value in equity_curve:
        if value > peak:
            peak = value
        dd = peak - value
        dd_pct = dd / peak if peak > 0 else 0
        if dd > max_dd:
            max_dd = dd
            max_dd_pct = dd_pct
    return max_dd, max_dd_pct


def sharpe_ratio(pnl_list: List[float], risk_free_rate: float = 0.0) -> float:
    """
    Sharpe Ratio: (mean_return - risk_free_rate) / std_dev.
    Measures risk-adjusted return.
    """
    if len(pnl_list) < 2:
        return 0.0
    m = mean(pnl_list)
    sd = std_dev(pnl_list)
    if sd == 0:
        return 0.0
    return (m - risk_free_rate) / sd


def kelly_criterion(win_rate_val: float, avg_win: float, avg_loss: float) -> float:
    """
    Kelly Criterion: optimal position size as fraction of capital.
    f* = (bp - q) / b
    where b = avg_win/avg_loss, p = win_rate, q = 1 - win_rate.
    Returns value between 0.0 and 1.0 (capped at 25% for safety).
    """
    if avg_loss == 0 or avg_win == 0:
        return 0.0
    b = avg_win / abs(avg_loss)
    p = win_rate_val
    q = 1 - p
    f = (b * p - q) / b
    # Half-Kelly for safety, capped at 25%
    return max(0.0, min(f * 0.5, 0.25))


def z_score_streak(pnl_list: List[float]) -> float:
    """
    Z-Score to test if win/loss streaks are random or statistically significant.
    Z > 1.96 or Z < -1.96 → non-random streaks (95% confidence).
    """
    n = len(pnl_list)
    if n < 2:
        return 0.0
    runs = 1
    wins_count = sum(1 for p in pnl_list if p > 0)
    losses_count = n - wins_count
    for i in range(1, n):
        if (pnl_list[i] > 0) != (pnl_list[i - 1] > 0):
            runs += 1
    if wins_count == 0 or losses_count == 0:
        return 0.0
    expected_runs = (2 * wins_count * losses_count / n) + 1
    variance_runs = (
        (2 * wins_count * losses_count * (2 * wins_count * losses_count - n))
        / (n ** 2 * (n - 1))
    )
    if variance_runs <= 0:
        return 0.0
    return (runs - expected_runs) / math.sqrt(variance_runs)


def win_loss_streaks(pnl_list: List[float]) -> Tuple[int, int]:
    """Returns (longest_win_streak, longest_loss_streak)."""
    if not pnl_list:
        return 0, 0
    max_win = max_loss = cur_win = cur_loss = 0
    for p in pnl_list:
        if p > 0:
            cur_win += 1
            cur_loss = 0
        else:
            cur_loss += 1
            cur_win = 0
        max_win = max(max_win, cur_win)
        max_loss = max(max_loss, cur_loss)
    return max_win, max_loss


def monte_carlo_drawdown(
    pnl_list: List[float],
    simulations: int = 1000,
    initial_balance: float = 10000.0,
) -> dict:
    """
    Monte Carlo simulation: randomly reshuffles trade sequence to estimate
    distribution of possible maximum drawdowns.
    Returns dict with percentile outcomes.
    """
    import random
    if not pnl_list:
        return {"p50": 0.0, "p75": 0.0, "p90": 0.0, "p95": 0.0}

    drawdowns = []
    for _ in range(simulations):
        shuffled = pnl_list[:]
        random.shuffle(shuffled)
        equity = [initial_balance]
        for pnl_val in shuffled:
            equity.append(equity[-1] + pnl_val)
        dd, _ = max_drawdown(equity)
        drawdowns.append(dd)

    drawdowns.sort()
    n = len(drawdowns)
    return {
        "p50": drawdowns[int(n * 0.50)],
        "p75": drawdowns[int(n * 0.75)],
        "p90": drawdowns[int(n * 0.90)],
        "p95": drawdowns[int(n * 0.95)],
        "mean": mean(drawdowns),
    }


def avg_trade_duration_minutes(entry_times, exit_times) -> float:
    """Average trade hold time in minutes."""
    durations = []
    for entry, exit_t in zip(entry_times, exit_times):
        if entry and exit_t:
            diff = (exit_t - entry).total_seconds() / 60
            durations.append(diff)
    return mean(durations)


def calculate_edge_score(
    pnl_list: List[float],
    max_dd_pct: float,
    limit_dd_pct: float,
    daily_limit_breached: bool = False
) -> float:
    """
    Computes an Edge Score from 0 to 100 representing trading discipline and edge.
    Formula:
    Score = (Win Rate * 40) + (Profit Factor Rating * 35) + (Drawdown Adherence * 25)
    Deducts heavily if limits are breached.
    """
    if not pnl_list:
        return 0.0

    # 1. Win Rate contribution (max 40)
    wr = win_rate(pnl_list)
    wr_score = wr * 40

    # 2. Profit Factor contribution (max 35)
    pf = profit_factor(pnl_list)
    if pf == float("inf") or pf > 3.0:
        pf_score = 35.0
    elif pf < 1.0:
        pf_score = pf * 15.0  # severely penalize negative systems
    else:
        pf_score = 15.0 + ((pf - 1.0) / 2.0) * 20.0  # linear scale 1.0 to 3.0
    pf_score = max(0.0, min(pf_score, 35.0))

    # 3. Drawdown Adherence contribution (max 25)
    if limit_dd_pct <= 0:
        dd_score = 25.0
    else:
        dd_ratio = max_dd_pct / limit_dd_pct
        if dd_ratio >= 1.0:
            dd_score = 0.0
        else:
            dd_score = (1.0 - dd_ratio) * 25.0
    dd_score = max(0.0, min(dd_score, 25.0))

    total_score = wr_score + pf_score + dd_score

    # Penalize if daily loss limit was breached
    if daily_limit_breached:
        total_score *= 0.50  # Cut score in half as discipline penalty

    return round(max(0.0, min(total_score, 100.0)), 1)

