from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import schemas
from app.services import expense_service
from app.services.audit_service import log_action
from app.core.jwt_handler import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/expenses", tags=["Expenses"])


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.post("/", response_model=schemas.ExpenseResponse)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = expense_service.add_expense(
        db=db,
        user_id=user_id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
    )
    log_action(db, action="add_expense", endpoint="/expenses/", status="success", user_id=user_id, detail=f"Amount: {expense.amount}, Category: {expense.category}")
    return result


@router.get("/", response_model=list[schemas.ExpenseResponse])
def list_expenses(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return expense_service.get_user_expenses(db, user_id)


@router.get("/summary", response_model=schemas.ExpenseSummaryResponse)
def monthly_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return expense_service.get_monthly_summary(db, user_id, month, year)