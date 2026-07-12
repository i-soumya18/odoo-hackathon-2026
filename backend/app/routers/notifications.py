from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid

from app.database import get_db
from app.models import Notification, Employee
from app.services.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: uuid.UUID
    type: str
    message: str
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    return db.query(Notification).filter(
        Notification.employee_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

@router.post("/{id}/read")
def mark_notification_read(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.employee_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.read = True
    db.commit()
    return {"success": True}
