from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Income
from app.schemas import IncomeCreate, IncomeResponse, IncomeUpdate
from app.core.jwt_handler import decode_access_token  
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/income", tags=["Income"])

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id

@router.post("/add", response_model=IncomeResponse)
def add_income(data: IncomeCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    income = Income(
        user_id=user_id,
        amount=data.amount,
        source=data.source,
        month=data.month,
        year=data.year,
        note=data.note
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("/list", response_model=list[IncomeResponse])
def list_incomes(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return db.query(Income).filter(Income.user_id == user_id).all()


@router.get("/monthly/{month}/{year}", response_model=list[IncomeResponse])
def get_monthly_income(month: int, year: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return db.query(Income).filter(
        Income.user_id == user_id,
        Income.month == month,
        Income.year == year
    ).all()


@router.put("/update/{income_id}", response_model=IncomeResponse)
def update_income(income_id: int, data: IncomeUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    if data.amount is not None:
        income.amount = data.amount
    if data.source is not None:
        income.source = data.source
    if data.note is not None:
        income.note = data.note
    db.commit()
    db.refresh(income)
    return income


@router.delete("/delete/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    db.delete(income)
    db.commit()
    return {"message": "Income deleted successfully"}