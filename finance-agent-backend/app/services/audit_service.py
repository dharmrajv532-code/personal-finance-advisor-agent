from sqlalchemy.orm import Session
from app import models
from datetime import datetime


def log_action(
    db: Session,
    action: str,
    endpoint: str,
    status: str,
    user_id: int = None,
    detail: str = None,
):
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        endpoint=endpoint,
        status=status,
        detail=detail,
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    db.commit()