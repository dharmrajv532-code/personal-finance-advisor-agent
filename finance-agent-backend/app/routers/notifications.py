from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.email_digest import generate_digest, send_digest_email
from app.core.jwt_handler import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.post("/send-digest")
def send_monthly_digest(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    digest = generate_digest(db, user_id)
    
    sent = send_digest_email(
        to_email=digest["email"],
        subject=f"Monthly Financial Digest - {digest['month']}/{digest['year']}",
        html_body=digest["html_body"]
    )
    
    if not sent:
        raise HTTPException(status_code=500, detail="Email bhejne mein problem aayi")
    
    return {
        "message": f"Digest email bhej diya {digest['email']} pe!",
        "month": digest["month"],
        "year": digest["year"]
    }