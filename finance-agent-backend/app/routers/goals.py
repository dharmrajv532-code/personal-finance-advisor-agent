from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas
from app.services import goal_service
from app.services.audit_service import log_action
from app.core.jwt_handler import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/goals", tags=["Goals"])


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.post("/", response_model=schemas.GoalResponse)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = goal_service.create_goal(
        db=db,
        user_id=user_id,
        title=goal.title,
        target_amount=goal.target_amount,
        deadline=goal.deadline
    )
    log_action(db, action="create_goal", endpoint="/goals/", status="success", user_id=user_id, detail=f"Goal: {goal.title}, Target: {goal.target_amount}")
    return result


@router.get("/", response_model=list[schemas.GoalResponse])
def list_goals(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return goal_service.get_user_goals(db, user_id)


@router.put("/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(goal_id: int, data: schemas.GoalUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = goal_service.update_goal(db, goal_id, user_id, data)
    log_action(db, action="update_goal", endpoint=f"/goals/{goal_id}", status="success", user_id=user_id, detail=f"Goal ID: {goal_id} updated")
    return result


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = goal_service.delete_goal(db, goal_id, user_id)
    log_action(db, action="delete_goal", endpoint=f"/goals/{goal_id}", status="success", user_id=user_id, detail=f"Goal ID: {goal_id} deleted")
    return result


@router.post("/{goal_id}/add-savings", response_model=schemas.GoalResponse)
def add_savings(goal_id: int, amount: float, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    result = goal_service.add_savings(db, goal_id, user_id, amount)
    log_action(db, action="add_savings", endpoint=f"/goals/{goal_id}/add-savings", status="success", user_id=user_id, detail=f"Goal ID: {goal_id}, Amount: {amount}")
    return result