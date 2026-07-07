from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.services.life_stage import detect_life_stage

router = APIRouter(prefix="/user", tags=["User"])


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    stage_info = detect_life_stage(
        age=user.age, occupation=user.occupation, income=user.income
    )

    db_user = models.User(
        name=user.name,
        age=user.age,
        income=user.income,
        occupation=user.occupation,
        life_stage=stage_info["life_stage"],
        risk_profile=stage_info["risk_profile"],
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
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
    if data.risk_profile is not None:
        db_user.risk_profile = data.risk_profile
    if data.life_stage is not None:
        db_user.life_stage = data.life_stage
        
    db.commit()
    db.refresh(db_user)
    return db_user