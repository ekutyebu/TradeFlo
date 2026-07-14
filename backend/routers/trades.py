from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter()


@router.post("/", response_model=schemas.TradeResponse, status_code=201)
def create_trade(trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == trade.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db_trade = models.Trade(**trade.model_dump())
    db.add(db_trade)

    # Update account balance if trade is closed
    if trade.pnl and trade.status == models.TradeStatus.CLOSED:
        account.current_balance += trade.pnl

    db.commit()
    db.refresh(db_trade)
    return db_trade


@router.get("/", response_model=List[schemas.TradeResponse])
def list_trades(
    account_id: Optional[int] = Query(None),
    symbol: Optional[str] = Query(None),
    setup_tag: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Trade)
    if account_id:
        query = query.filter(models.Trade.account_id == account_id)
    if symbol:
        query = query.filter(models.Trade.symbol == symbol.upper())
    if setup_tag:
        query = query.filter(models.Trade.setup_tag == setup_tag)
    return query.order_by(models.Trade.entry_time.desc()).offset(offset).limit(limit).all()


@router.get("/{trade_id}", response_model=schemas.TradeResponse)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@router.put("/{trade_id}", response_model=schemas.TradeResponse)
def update_trade(trade_id: int, update: schemas.TradeUpdate, db: Session = Depends(get_db)):
    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    old_pnl = trade.pnl or 0.0
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(trade, field, value)

    # Reconcile account balance on PnL change
    if update.pnl is not None:
        account = db.query(models.Account).filter(models.Account.id == trade.account_id).first()
        if account:
            account.current_balance = account.current_balance - old_pnl + (update.pnl or 0)

    db.commit()
    db.refresh(trade)
    return trade


@router.delete("/{trade_id}", status_code=204)
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    # Reverse PnL from account balance
    account = db.query(models.Account).filter(models.Account.id == trade.account_id).first()
    if account and trade.pnl:
        account.current_balance -= trade.pnl

    db.delete(trade)
    db.commit()
