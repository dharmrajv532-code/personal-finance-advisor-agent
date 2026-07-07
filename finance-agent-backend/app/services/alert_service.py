from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app import models


def get_smart_alerts(db: Session, user_id: int) -> dict:
    now = datetime.utcnow()
    month = now.month
    year = now.year
    alerts = []

    # 1. Budget Alerts (80% cross ho gayi)
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.month == month,
        models.Budget.year == year,
    ).all()

    for budget in budgets:
        spent = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == user_id,
            func.lower(models.Expense.category) == budget.category.lower(),
            extract("month", models.Expense.date) == month,
            extract("year", models.Expense.date) == year,
        ).scalar() or 0.0

        percent_used = (spent / budget.monthly_limit) * 100 if budget.monthly_limit > 0 else 0

        if percent_used >= 100:
            alerts.append({
                "type": "budget_exceeded",
                "category": budget.category,
                "message": f"⚠️ '{budget.category}' budget exceed ho gaya! ({round(percent_used, 1)}% used)"
            })
        elif percent_used >= 80:
            alerts.append({
                "type": "budget_warning",
                "category": budget.category,
                "message": f"🟡 '{budget.category}' budget 80% use ho gaya ({round(percent_used, 1)}% used)"
            })

    # 2. Goal Deadline Alerts (30 days bacha ho)
    goals = db.query(models.Goal).filter(models.Goal.user_id == user_id).all()

    for goal in goals:
        if goal.deadline:
            days_left = (goal.deadline - now).days
            progress = (goal.saved_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0

            if days_left < 0:
                alerts.append({
                    "type": "goal_overdue",
                    "goal": goal.title,
                    "message": f"🔴 '{goal.title}' goal ki deadline nikal gayi! Sirf {round(progress, 1)}% complete hai."
                })
            elif days_left <= 30:
                alerts.append({
                    "type": "goal_deadline_near",
                    "goal": goal.title,
                    "message": f"⏰ '{goal.title}' goal ki deadline {days_left} din mein hai! {round(progress, 1)}% complete."
                })

    return {
        "total_alerts": len(alerts),
        "alerts": alerts
    }