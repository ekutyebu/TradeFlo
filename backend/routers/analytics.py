from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from ai.coach import compute_analytics, build_equity_curve, trades_to_dicts
from ai.patterns import generate_insights, day_of_week_analysis, session_analysis, symbol_analysis
from ai.risk import evaluate_all_risks, calculate_position_size
import models, schemas
from datetime import datetime

router = APIRouter()


@router.get("/{account_id}/summary", response_model=schemas.AnalyticsSummary)
def get_summary(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    trades = db.query(models.Trade).filter(
        models.Trade.account_id == account_id,
        models.Trade.status == models.TradeStatus.CLOSED,
    ).order_by(models.Trade.entry_time).all()
    sessions = db.query(models.Session).filter(models.Session.account_id == account_id).all()
    return compute_analytics(account, trades, sessions)


@router.get("/{account_id}/equity-curve")
def get_equity_curve(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    trades = (
        db.query(models.Trade)
        .filter(models.Trade.account_id == account_id, models.Trade.status == models.TradeStatus.CLOSED)
        .order_by(models.Trade.entry_time)
        .all()
    )
    trade_dicts = trades_to_dicts(trades)
    points = []
    balance = account.initial_balance
    for t in trade_dicts:
        balance += t["pnl"]
        points.append({
            "timestamp": t["entry_time"].isoformat() if t["entry_time"] else None,
            "balance": round(balance, 2),
            "trade_id": t["id"],
            "pnl": t["pnl"],
        })
    return {"account_id": account_id, "initial_balance": account.initial_balance, "points": points}


@router.get("/{account_id}/insights")
def get_insights(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    trades = db.query(models.Trade).filter(models.Trade.account_id == account_id).all()
    sessions = db.query(models.Session).filter(models.Session.account_id == account_id).all()
    trade_dicts = trades_to_dicts(trades)
    session_dicts = [{"id": s.id, "date": s.date, "mood": s.mood.value if hasattr(s.mood, "value") else s.mood} for s in sessions]
    account_dict = {
        "id": account.id, "name": account.name,
        "current_balance": account.current_balance, "currency": account.currency,
        "max_daily_loss_pct": account.max_daily_loss_pct, "max_drawdown_pct": account.max_drawdown_pct,
        "risk_per_trade_pct": account.risk_per_trade_pct,
    }
    insights = generate_insights(trade_dicts, session_dicts, account_dict)
    return {"account_id": account_id, "insights": insights}


@router.get("/{account_id}/risk-alerts")
def get_risk_alerts(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    all_trades = db.query(models.Trade).filter(models.Trade.account_id == account_id).all()
    trade_dicts = trades_to_dicts(all_trades)
    today = datetime.utcnow().date()
    trades_today = [t for t in trade_dicts if t["entry_time"] and t["entry_time"].date() == today]
    equity_curve = build_equity_curve(trade_dicts, account.initial_balance)
    account_dict = {
        "current_balance": account.current_balance,
        "max_daily_loss_pct": account.max_daily_loss_pct,
        "max_drawdown_pct": account.max_drawdown_pct,
    }
    alerts = evaluate_all_risks(account_dict, trades_today, trade_dicts, equity_curve)
    return {"account_id": account_id, "alerts": alerts}


@router.get("/position-size")
def get_position_size(
    account_id: int,
    stop_loss_pips: float,
    pip_value: float = 10.0,
    db: Session = Depends(get_db),
):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    lot_size = calculate_position_size(
        account.current_balance, account.risk_per_trade_pct, stop_loss_pips, pip_value
    )
    risk_amount = account.current_balance * (account.risk_per_trade_pct / 100)
    return {
        "recommended_lot_size": lot_size,
        "risk_amount": round(risk_amount, 2),
        "risk_pct": account.risk_per_trade_pct,
        "stop_loss_pips": stop_loss_pips,
        "pip_value": pip_value,
    }
