from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app import models, schemas
from app.core.security import hash_password, verify_password, generate_reset_code
from app.core.jwt_handler import create_access_token
from app.core.rate_limiter import limiter
from app.services.life_stage import detect_life_stage
from app.services.email_service import send_reset_code_email
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        log_action(db, action="register", endpoint="/auth/register", status="failed", detail="Email already registered")
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        age=None,
        income=None,
        occupation=None,
        life_stage=None,
        risk_profile=None,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    log_action(db, action="register", endpoint="/auth/register", status="success", user_id=db_user.id, detail=f"User {user.email} registered")
    return db_user


@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not db_user or not verify_password(credentials.password, db_user.hashed_password):
        log_action(db, action="login", endpoint="/auth/login", status="failed", detail=f"Failed login for {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": db_user.id, "email": db_user.email})
    log_action(db, action="login", endpoint="/auth/login", status="success", user_id=db_user.id, detail=f"User {credentials.email} logged in")
    return {"access_token": token}


@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found")

    code = generate_reset_code()
    db_user.reset_code = code
    db_user.reset_code_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    sent = send_reset_code_email(request.email, code)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"message": "Reset code sent to your email"}


@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user or db_user.reset_code != request.reset_code:
        raise HTTPException(status_code=400, detail="Invalid reset code")

    if not db_user.reset_code_expiry or db_user.reset_code_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset code expired")

    db_user.hashed_password = hash_password(request.new_password)
    db_user.reset_code = None
    db_user.reset_code_expiry = None
    db.commit()

    return {"message": "Password reset successful"}