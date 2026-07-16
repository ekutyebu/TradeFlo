from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter()


@router.post("/", response_model=schemas.NotebookPageResponse, status_code=201)
def create_page(page: schemas.NotebookPageCreate, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.id == page.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db_page = models.NotebookPage(**page.model_dump())
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page


@router.get("/", response_model=List[schemas.NotebookPageResponse])
def list_pages(
    account_id: int,
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.NotebookPage).filter(models.NotebookPage.account_id == account_id)
    if category:
        query = query.filter(models.NotebookPage.category == category)
    return query.order_by(models.NotebookPage.updated_at.desc()).all()


@router.get("/{page_id}", response_model=schemas.NotebookPageResponse)
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(models.NotebookPage).filter(models.NotebookPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.put("/{page_id}", response_model=schemas.NotebookPageResponse)
def update_page(page_id: int, update: schemas.NotebookPageUpdate, db: Session = Depends(get_db)):
    page = db.query(models.NotebookPage).filter(models.NotebookPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    for field, value in update.model_dump(exclude_none=True).items():
        setattr(page, field, value)

    db.commit()
    db.refresh(page)
    return page


@router.delete("/{page_id}", status_code=204)
def delete_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(models.NotebookPage).filter(models.NotebookPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    db.delete(page)
    db.commit()
