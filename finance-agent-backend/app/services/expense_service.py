from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app import models


def add_expense(db: Session, user_id: int, amount: float, category: str, description: str = None):
    expense = models.Expense(
        user_id=user_id,
        amount=amount,
        category=category,
        description=description,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_user_expenses(db: Session, user_id: int):
    return db.query(models.Expense).filter(models.Expense.user_id == user_id).order_by(models.Expense.date.desc()).all()


def get_monthly_summary(db: Session, user_id: int, month: int = None, year: int = None):
    if month is None:
        month = datetime.utcnow().month
    if year is None:
        year = datetime.utcnow().year

    query = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.user_id == user_id,
        extract("month", models.Expense.date) == month,
        extract("year", models.Expense.date) == year,
    ).group_by(models.Expense.category)

    results = query.all()
    total_spent = sum(r.total for r in results)
    breakdown = [{"category": r.category, "total": r.total} for r in results]

    return {"total_spent": total_spent, "category_breakdown": breakdown}