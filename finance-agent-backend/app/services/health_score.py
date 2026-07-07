from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app import models


def calculate_health_score(db: Session, user_id: int) -> dict:
    now = datetime.utcnow()
    month = now.month
    year = now.year

    # 1. Income this month
    incomes = db.query(models.Income).filter(
        models.Income.user_id == user_id,
        models.Income.month == month,
        models.Income.year == year,
    ).all()
    total_income = sum(i.amount for i in incomes)

    # 2. Expenses this month
    expenses = db.query(models.Expense).filter(
        models.Expense.user_id == user_id,
        extract("month", models.Expense.date) == month,
        extract("year", models.Expense.date) == year,
    ).all()
    total_expense = sum(e.amount for e in expenses)

    # 3. Budgets this month
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.month == month,
        models.Budget.year == year,
    ).all()

    # 4. Goals
    goals = db.query(models.Goal).filter(models.Goal.user_id == user_id).all()

    # --- Score Calculation ---
    score = 0
    breakdown = {}

    # A. Savings Rate (max 30 points)
    if total_income > 0:
        savings_rate = (total_income - total_expense) / total_income * 100
        if savings_rate >= 30:
            savings_score = 30
        elif savings_rate >= 20:
            savings_score = 22
        elif savings_rate >= 10:
            savings_score = 14
        elif savings_rate >= 0:
            savings_score = 6
        else:
            savings_score = 0
    else:
        savings_rate = 0
        savings_score = 0

    score += savings_score
    breakdown["savings_rate"] = {
        "score": savings_score,
        "max": 30,
        "value": round(savings_rate, 1)
    }

    # B. Budget Adherence (max 30 points)
    if budgets:
        exceeded = 0
        for b in budgets:
            spent = sum(
                e.amount for e in expenses
                if e.category.lower() == b.category.lower()
            )
            if spent > b.monthly_limit:
                exceeded += 1
        adherence_rate = (1 - exceeded / len(budgets)) * 100
        budget_score = int(adherence_rate * 30 / 100)
    else:
        adherence_rate = 100
        budget_score = 15  # neutral if no budgets set

    score += budget_score
    breakdown["budget_adherence"] = {
        "score": budget_score,
        "max": 30,
        "value": round(adherence_rate, 1)
    }

    # C. Goal Progress (max 25 points)
    if goals:
        avg_progress = sum(
            (g.saved_amount / g.target_amount * 100) if g.target_amount > 0 else 0
            for g in goals
        ) / len(goals)
        goal_score = int(avg_progress * 25 / 100)
        goal_score = min(goal_score, 25)
    else:
        avg_progress = 0
        goal_score = 0

    score += goal_score
    breakdown["goal_progress"] = {
        "score": goal_score,
        "max": 25,
        "value": round(avg_progress, 1)
    }

    # D. Income Tracked (max 15 points)
    if total_income > 0:
        income_score = 15
    else:
        income_score = 0

    score += income_score
    breakdown["income_tracked"] = {
        "score": income_score,
        "max": 15,
        "value": total_income
    }

    # --- Grade ---
    if score >= 80:
        grade = "Excellent 🟢"
    elif score >= 60:
        grade = "Good 🟡"
    elif score >= 40:
        grade = "Average 🟠"
    else:
        grade = "Needs Improvement 🔴"

    return {
        "score": score,
        "max_score": 100,
        "grade": grade,
        "breakdown": breakdown,
        "month": month,
        "year": year,
    }