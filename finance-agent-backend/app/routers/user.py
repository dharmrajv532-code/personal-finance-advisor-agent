from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.services.life_stage import detect_life_stage

router = APIRouter(prefix="/user", tags=["User"])


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    age_val = user.age
    occupation_val = user.occupation
    income_val = user.income

    if age_val is not None and occupation_val is not None and income_val is not None:
        stage_info = detect_life_stage(age=age_val, occupation=occupation_val, income=income_val)
        life_stage = stage_info["life_stage"]
        risk_profile = stage_info["risk_profile"]
    else:
        life_stage = None
        risk_profile = None

    from app.core.security import hash_password

    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        age=age_val,
        income=income_val,
        occupation=occupation_val,
        life_stage=life_stage,
        risk_profile=risk_profile,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Auto-populate current month income if provided
    if income_val is not None and income_val > 0:
        from datetime import datetime
        now = datetime.utcnow()
        db_income = models.Income(
            user_id=db_user.id,
            amount=income_val,
            source="Onboarding Base Income",
            month=now.month,
            year=now.year,
            note="Automatically added during profile setup."
        )
        db.add(db_income)
        db.commit()

    return db_user


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, data: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.name is not None:
        db_user.name = data.name
    if data.age is not None:
        db_user.age = data.age
    if data.income is not None:
        db_user.income = data.income
    if data.occupation is not None:
        db_user.occupation = data.occupation

    # Auto-calculate life_stage and risk_profile if required fields are present
    age_val = data.age if data.age is not None else db_user.age
    occupation_val = data.occupation if data.occupation is not None else db_user.occupation
    income_val = data.income if data.income is not None else db_user.income

    if age_val is not None and occupation_val is not None and income_val is not None:
        stage_info = detect_life_stage(age=age_val, occupation=occupation_val, income=income_val)
        db_user.life_stage = stage_info["life_stage"]
        db_user.risk_profile = stage_info["risk_profile"]

    if data.risk_profile is not None:
        db_user.risk_profile = data.risk_profile
    if data.life_stage is not None:
        db_user.life_stage = data.life_stage
        
    db.commit()
    db.refresh(db_user)

    # Auto-populate current month income if not already present
    if income_val is not None and income_val > 0:
        from datetime import datetime
        now = datetime.utcnow()
        existing_income = db.query(models.Income).filter(
            models.Income.user_id == db_user.id,
            models.Income.month == now.month,
            models.Income.year == now.year
        ).first()
        if not existing_income:
            db_income = models.Income(
                user_id=db_user.id,
                amount=income_val,
                source="Onboarding Base Income",
                month=now.month,
                year=now.year,
                note="Automatically added during profile setup."
            )
            db.add(db_income)
            db.commit()

    return db_user