from sqlalchemy.orm import Session
from app import models
from app.services.llm_client import get_groq_response
from datetime import datetime


def get_chat_history(db: Session, user_id: int, limit: int = 10):
    return db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id
    ).order_by(models.ChatHistory.created_at.desc()).limit(limit).all()


def save_message(db: Session, user_id: int, role: str, message: str):
    chat = models.ChatHistory(
        user_id=user_id,
        role=role,
        message=message,
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


def build_user_context(db: Session, user_id: int) -> str:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return ""

    # Latest month expenses
    now = datetime.utcnow()
    expenses = db.query(models.Expense).filter(
        models.Expense.user_id == user_id,
    ).order_by(models.Expense.date.desc()).limit(10).all()

    # Goals
    goals = db.query(models.Goal).filter(models.Goal.user_id == user_id).all()

    # Income this month
    incomes = db.query(models.Income).filter(
        models.Income.user_id == user_id,
        models.Income.month == now.month,
        models.Income.year == now.year,
    ).all()

    total_income = sum(i.amount for i in incomes)
    total_expense = sum(e.amount for e in expenses)

    context = f"""
User Profile:
- Name: {user.name}
- Age: {user.age}
- Occupation: {user.occupation}
- Life Stage: {user.life_stage}
- Risk Profile: {user.risk_profile}

This Month Financial Summary:
- Total Income: ₹{total_income}
- Recent Expenses (last 10): ₹{total_expense}

Goals:
"""
    for g in goals:
        progress = (g.saved_amount / g.target_amount * 100) if g.target_amount > 0 else 0
        context += f"- {g.title}: ₹{g.saved_amount}/₹{g.target_amount} ({progress:.1f}% complete)\n"

    return context.strip()


def chat_with_advisor(db: Session, user_id: int, user_message: str) -> str:
    # Build context
    user_context = build_user_context(db, user_id)

    # Get last 10 messages for history
    history = get_chat_history(db, user_id, limit=10)
    history = list(reversed(history))  # oldest first

    # System prompt
    system_prompt = f"""You are a personal finance advisor AI. You give practical, 
personalized financial advice based on the user's profile and financial data.
Always be helpful, concise, and friendly. Give advice in simple language.

CRITICAL INSTRUCTION ON LANGUAGE:
Detect the language of the user's message. You MUST respond in the EXACT same language/script used by the user:
- If the user writes in English, reply in English.
- If the user writes in Hindi (using Devanagari script, e.g. "नमस्ते"), reply in Hindi (using Devanagari script).
- If the user writes in Hinglish (Hindi words written using Latin script, e.g. "kya haal hai", "savings kaise badhayein"), reply in Hinglish (Hindi words in Latin script).

Current User Context:
{user_context}
"""

    # Build messages list
    messages = [{"role": "system", "content": system_prompt}]

    # Add chat history
    for h in history:
        messages.append({"role": h.role, "content": h.message})

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    # Save user message
    save_message(db, user_id, "user", user_message)

    # Get AI response
    response = get_groq_response(messages)

    # Save assistant response
    save_message(db, user_id, "assistant", response)

    return response