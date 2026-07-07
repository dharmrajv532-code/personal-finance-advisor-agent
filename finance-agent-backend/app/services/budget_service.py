from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from fastapi import HTTPException
from app import models


def create_budget(db: Session, user_id: int, category: str, monthly_limit: float, month: int, year: int):
    category = category.strip().lower()

    existing = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.category == category,
        models.Budget.month == month,
        models.Budget.year == year,
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Budget for '{category}' in {month}/{year} already exists. Use update instead."
        )

    budget = models.Budget(
        user_id=user_id,
        category=category,
        monthly_limit=monthly_limit,
        month=month,
        year=year,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_user_budgets(db: Session, user_id: int, month: int = None, year: int = None):
    query = db.query(models.Budget).filter(models.Budget.user_id == user_id)
    if month is not None:
        query = query.filter(models.Budget.month == month)
    if year is not None:
        query = query.filter(models.Budget.year == year)
    return query.all()


def get_budget_by_id(db: Session, budget_id: int, user_id: int):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == user_id,
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


def update_budget(db: Session, budget_id: int, user_id: int, data):
    budget = get_budget_by_id(db, budget_id, user_id)
    if data.category is not None:
        budget.category = data.category.strip().lower()
    if data.monthly_limit is not None:
        budget.monthly_limit = data.monthly_limit
    if data.month is not None:
        budget.month = data.month
    if data.year is not None:
        budget.year = data.year
    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(db: Session, budget_id: int, user_id: int):
    budget = get_budget_by_id(db, budget_id, user_id)
    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}


def _get_spent_amount(db: Session, user_id: int, category: str, month: int, year: int) -> float:
    total = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == user_id,
        func.lower(models.Expense.category) == category.lower(),
        extract("month", models.Expense.date) == month,
        extract("year", models.Expense.date) == year,
    ).scalar()
    return float(total) if total else 0.0


def get_budget_status(db: Session, budget_id: int, user_id: int):
    budget = get_budget_by_id(db, budget_id, user_id)
    spent = _get_spent_amount(db, user_id, budget.category, budget.month, budget.year)
    remaining = budget.monthly_limit - spent

    return {
        "category": budget.category,
        "monthly_limit": budget.monthly_limit,
        "spent": spent,
        "remaining": remaining,
        "is_exceeded": spent > budget.monthly_limit,
    }


def get_all_budget_status(db: Session, user_id: int, month: int, year: int):
    budgets = get_user_budgets(db, user_id, month, year)
    return [
        get_budget_status(db, b.id, user_id)
        for b in budgets
    ]