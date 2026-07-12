from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import uuid

from app.database import get_db
from app.models import CSRActivity, EmployeeParticipation, Employee
from app.services.security import get_current_user, require_role

router = APIRouter(prefix="/social", tags=["social"])

class CSRActivityResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    department_id: Optional[uuid.UUID]
    date: date
    status: str

    class Config:
        from_attributes = True

class EmployeeParticipationResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    csr_activity_id: uuid.UUID
    proof_file_url: Optional[str]
    approval_status: str
    points_earned: Optional[int]
    
    class Config:
        from_attributes = True

class JoinCSRRequest(BaseModel):
    proof_file_url: Optional[str] = None

@router.get("/csr-activities", response_model=List[CSRActivityResponse])
def get_csr_activities(db: Session = Depends(get_db)):
    return db.query(CSRActivity).filter(CSRActivity.status == "Active").order_by(CSRActivity.date.desc()).all()

@router.post("/csr-activities/{activity_id}/join", response_model=EmployeeParticipationResponse)
def join_csr_activity(
    activity_id: uuid.UUID,
    req: JoinCSRRequest,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    activity = db.query(CSRActivity).filter(CSRActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="CSR Activity not found")
        
    if activity.status != "Active":
        raise HTTPException(status_code=400, detail="Cannot join inactive CSR activity")
        
    existing = db.query(EmployeeParticipation).filter(
        EmployeeParticipation.employee_id == current_user.id,
        EmployeeParticipation.csr_activity_id == activity_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already participating in this activity")
        
    participation = EmployeeParticipation(
        employee_id=current_user.id,
        csr_activity_id=activity_id,
        proof_file_url=req.proof_file_url,
        approval_status="Pending"
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)
    return participation

@router.get("/csr-participations/pending", response_model=List[EmployeeParticipationResponse])
def get_pending_participations(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role("Admin", "Manager"))
):
    # For a manager, we might want to filter to just their department's employees.
    # For now, returning all pending for simplicity as allowed in hackathon.
    return db.query(EmployeeParticipation).filter(
        EmployeeParticipation.approval_status == "Pending"
    ).all()
