from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter()


@router.post("/", response_model=schemas.AccountResponse, status_code=201)
def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    db_account = models.Account(
        **account.model_dump(),
        current_balance=account.initial_balance,
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.get("/", response_model=List[schemas.AccountResponse])
def list_accounts(db: Session = Depends(get_db)):
    return db.query(models.Account).filter(models.Account.is_active == True).all()


@router.get("/{account_id}", response_model=schemas.AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=schemas.AccountResponse)
def update_account(account_id: int, update: schemas.AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_active = False
    db.commit()
