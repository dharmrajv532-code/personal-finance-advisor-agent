from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import schemas
from app.services import budget_service
from app.services.audit_service import log_action
from app.core.jwt_handler import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/budget", tags=["Budget"])


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.post("/", response_model=schemas.BudgetResponse)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = budget_service.create_budget(
        db=db,
        user_id=user_id,
        category=budget.category,
        monthly_limit=budget.monthly_limit,
        month=budget.month,
        year=budget.year,
    )
    log_action(db, action="create_budget", endpoint="/budget/", status="success", user_id=user_id, detail=f"Category: {budget.category}, Limit: {budget.monthly_limit}, {budget.month}/{budget.year}")
    return result


@router.get("/", response_model=list[schemas.BudgetResponse])
def list_budgets(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return budget_service.get_user_budgets(db, user_id, month, year)


@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(budget_id: int, data: schemas.BudgetUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = budget_service.update_budget(db, budget_id, user_id, data)
    log_action(db, action="update_budget", endpoint=f"/budget/{budget_id}", status="success", user_id=user_id, detail=f"Budget ID: {budget_id} updated")
    return result


@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = budget_service.delete_budget(db, budget_id, user_id)
    log_action(db, action="delete_budget", endpoint=f"/budget/{budget_id}", status="success", user_id=user_id, detail=f"Budget ID: {budget_id} deleted")
    return result


@router.get("/{budget_id}/status", response_model=schemas.BudgetStatusResponse)
def budget_status(budget_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return budget_service.get_budget_status(db, budget_id, user_id)


@router.get("/status/all")
def all_budget_status(
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return budget_service.get_all_budget_status(db, user_id, month, year)