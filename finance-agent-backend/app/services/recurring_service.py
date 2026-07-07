from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app import models


def detect_recurring_expenses(db: Session, user_id: int) -> dict:
    now = datetime.utcnow()

    # Last 3 months check
    months = []
    for i in range(1, 4):
        m = now.month - i
        y = now.year
        if m <= 0:
            m += 12
            y -= 1
        months.append((m, y))

    category_month_count = {}

    for month, year in months:
        results = db.query(
            models.Expense.category
        ).filter(
            models.Expense.user_id == user_id,
            extract("month", models.Expense.date) == month,
            extract("year", models.Expense.date) == year,
        ).distinct().all()

        for r in results:
            cat = r.category.lower()
            category_month_count[cat] = category_month_count.get(cat, 0) + 1

    # Jo 2+ months mein aaye woh recurring hai
    recurring = [cat for cat, count in category_month_count.items() if count >= 2]

    return {
        "recurring_categories": recurring,
        "total_recurring": len(recurring)
    }