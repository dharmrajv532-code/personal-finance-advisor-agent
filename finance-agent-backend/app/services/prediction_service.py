from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app import models


def predict_next_month_expenses(db: Session, user_id: int) -> dict:
    now = datetime.utcnow()
    
    # Last 3 months ka data
    months = []
    for i in range(1, 4):
        m = now.month - i
        y = now.year
        if m <= 0:
            m += 12
            y -= 1
        months.append((m, y))

    category_totals = {}

    for month, year in months:
        results = db.query(
            models.Expense.category,
            func.sum(models.Expense.amount).label("total")
        ).filter(
            models.Expense.user_id == user_id,
            extract("month", models.Expense.date) == month,
            extract("year", models.Expense.date) == year,
        ).group_by(models.Expense.category).all()

        for r in results:
            cat = r.category.lower()
            if cat not in category_totals:
                category_totals[cat] = []
            category_totals[cat].append(r.total)

    # Average nikalo
    predictions = {}
    for cat, amounts in category_totals.items():
        predictions[cat] = round(sum(amounts) / len(amounts), 2)

    total_predicted = round(sum(predictions.values()), 2)

    return {
        "predicted_month": now.month + 1 if now.month < 12 else 1,
        "predicted_year": now.year if now.month < 12 else now.year + 1,
        "category_predictions": predictions,
        "total_predicted": total_predicted
    }