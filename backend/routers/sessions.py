from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter()


@router.post("/", response_model=schemas.SessionResponse, status_code=201)
def create_session(session: schemas.SessionCreate, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == session.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db_session = models.Session(**session.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/", response_model=List[schemas.SessionResponse])
def list_sessions(account_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Session)
        .filter(models.Session.account_id == account_id)
        .order_by(models.Session.date.desc())
        .all()
    )


@router.get("/{session_id}", response_model=schemas.SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.put("/{session_id}", response_model=schemas.SessionResponse)
def update_session(session_id: int, update: dict, db: Session = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    for field, value in update.items():
        if hasattr(session, field):
            setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session
