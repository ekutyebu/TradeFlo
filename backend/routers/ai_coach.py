from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from ai.chat import get_chat_response
from ai.coach import compute_analytics, build_ai_context
from config import settings
import models, schemas

router = APIRouter()


@router.post("/chat", response_model=schemas.ChatResponse)
async def chat(message: schemas.ChatMessageCreate, db: Session = Depends(get_db)):
    """Send a message to the AI Coach and receive a response."""

    # Save user message
    user_msg = models.ChatMessage(
        account_id=message.account_id,
        role="user",
        content=message.content,
        context_type=message.context_type,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Build context if account is provided
    context = None
    if message.account_id:
        account = db.query(models.Account).filter(models.Account.id == message.account_id).first()
        if account:
            trades = db.query(models.Trade).filter(
                models.Trade.account_id == message.account_id,
                models.Trade.status == models.TradeStatus.CLOSED,
            ).order_by(models.Trade.entry_time).all()
            sessions = db.query(models.Session).filter(models.Session.account_id == message.account_id).all()
            analytics = compute_analytics(account, trades, sessions)
            context = build_ai_context(account, analytics, trades, sessions)

    # Get conversation history for this account
    history_query = db.query(models.ChatMessage).filter(
        models.ChatMessage.account_id == message.account_id
    ).order_by(models.ChatMessage.created_at.desc()).limit(12).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(history_query)]

    # Get AI response
    response_text = await get_chat_response(
        message=message.content,
        conversation_history=history,
        context=context,
        api_key=settings.gemini_api_key,
    )

    # Save assistant message
    assistant_msg = models.ChatMessage(
        account_id=message.account_id,
        role="assistant",
        content=response_text,
        context_type=message.context_type,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return schemas.ChatResponse(
        user_message=schemas.ChatMessageResponse.model_validate(user_msg),
        assistant_message=schemas.ChatMessageResponse.model_validate(assistant_msg),
    )


@router.get("/history", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(
    account_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(models.ChatMessage)
    if account_id:
        query = query.filter(models.ChatMessage.account_id == account_id)
    return query.order_by(models.ChatMessage.created_at.asc()).limit(limit).all()


@router.delete("/history")
def clear_history(account_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.ChatMessage)
    if account_id:
        query = query.filter(models.ChatMessage.account_id == account_id)
    query.delete()
    db.commit()
    return {"message": "Chat history cleared"}
