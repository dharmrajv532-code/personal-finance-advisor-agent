from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.finance_advisor import chat_with_advisor
from app.services.audit_service import log_action
from app.core.jwt_handler import decode_access_token
from app.core.rate_limiter import limiter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/advisor", tags=["AI Advisor"])


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
@limiter.limit("10/minute")
def chat(request: Request, chat_request: ChatRequest, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    response = chat_with_advisor(db, user_id, chat_request.message)
    log_action(db, action="advisor_chat", endpoint="/advisor/chat", status="success", user_id=user_id, detail=f"Message: {chat_request.message[:50]}")
    return {"response": response}


@router.get("/history")
def get_history(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    from app.models import ChatHistory
    history = db.query(ChatHistory).filter(
        ChatHistory.user_id == user_id
    ).order_by(ChatHistory.created_at.asc()).all()
    return [{"role": h.role, "message": h.message, "time": h.created_at} for h in history]