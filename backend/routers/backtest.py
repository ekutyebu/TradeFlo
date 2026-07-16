from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter()


@router.post("/", response_model=schemas.BacktestRunResponse, status_code=201)
def create_backtest_run(run: schemas.BacktestRunCreate, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == run.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db_run = models.BacktestRun(**run.model_dump())
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run


@router.get("/", response_model=List[schemas.BacktestRunResponse])
def list_backtest_runs(account_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.BacktestRun)
        .filter(models.BacktestRun.account_id == account_id)
        .order_by(models.BacktestRun.created_at.desc())
        .all()
    )


@router.delete("/{run_id}", status_code=204)
def delete_backtest_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(models.BacktestRun).filter(models.BacktestRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Backtest run not found")

    db.delete(run)
    db.commit()
