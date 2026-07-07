from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.health_score import calculate_health_score
from app.core.jwt_handler import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.health_score import calculate_health_score
from app.services import expense_service, budget_service
from app.models import Income, Goal
from datetime import datetime
from app.services.prediction_service import predict_next_month_expenses
from app.services.recurring_service import detect_recurring_expenses
from app.services.alert_service import get_smart_alerts


oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id

@router.get("/health-score")
def get_health_score(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return calculate_health_score(db, user_id)

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    now = datetime.utcnow()
    month = now.month
    year = now.year

    # Income
    incomes = db.query(Income).filter(
        Income.user_id == user_id,
        Income.month == month,
        Income.year == year
    ).all()
    total_income = sum(i.amount for i in incomes)

    # Expenses
    expense_summary = expense_service.get_monthly_summary(db, user_id, month, year)

    # Budget status
    budget_status = budget_service.get_all_budget_status(db, user_id, month, year)

    # Goals
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    goals_data = [
        {
            "title": g.title,
            "target": g.target_amount,
            "saved": g.saved_amount,
            "progress_pct": round(g.saved_amount / g.target_amount * 100, 1) if g.target_amount > 0 else 0
        }
        for g in goals
    ]

    # Health Score
    health = calculate_health_score(db, user_id)

    return {
        "month": month,
        "year": year,
        "income": total_income,
        "expenses": expense_summary,
        "budget_status": budget_status,
        "goals": goals_data,
        "health_score": health
    }

@router.get("/predictions")
def expense_predictions(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return predict_next_month_expenses(db, user_id)


@router.get("/recurring")
def recurring_expenses(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return detect_recurring_expenses(db, user_id)


@router.get("/alerts")
def smart_alerts(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return get_smart_alerts(db, user_id)