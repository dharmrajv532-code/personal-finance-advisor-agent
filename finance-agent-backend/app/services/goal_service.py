from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models


def create_goal(db: Session, user_id: int, title: str, target_amount: float, deadline=None):
    goal = models.Goal(
        user_id=user_id,
        title=title,
        target_amount=target_amount,
        saved_amount=0.0,
        deadline=deadline
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def get_user_goals(db: Session, user_id: int):
    return db.query(models.Goal).filter(models.Goal.user_id == user_id).all()


def get_goal_by_id(db: Session, goal_id: int, user_id: int):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


def update_goal(db: Session, goal_id: int, user_id: int, data):
    goal = get_goal_by_id(db, goal_id, user_id)
    if data.title is not None:
        goal.title = data.title
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.saved_amount is not None:
        goal.saved_amount = data.saved_amount
    if data.deadline is not None:
        goal.deadline = data.deadline
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, goal_id: int, user_id: int):
    goal = get_goal_by_id(db, goal_id, user_id)
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}


def add_savings(db: Session, goal_id: int, user_id: int, amount: float):
    goal = get_goal_by_id(db, goal_id, user_id)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    goal.saved_amount += amount
    db.commit()
    db.refresh(goal)
    return goal