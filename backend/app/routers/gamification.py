from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.database import get_db
from app.models import (
    Challenge, ChallengeParticipation, CSRActivity, EmployeeParticipation,
    Reward, Employee, Organization, Department
)
from app.services.security import require_role
from app.services.badge_engine import check_and_award_badges
from app.services.security import get_current_user

router = APIRouter(tags=["gamification"])

class StatusUpdate(BaseModel):
    status: str

@router.patch("/challenges/{challenge_id}/status")
def update_challenge_status(
    challenge_id: uuid.UUID, 
    update: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role("Admin", "Manager"))
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    valid_transitions = {
        "Draft": ["Active", "Archived"],
        "Active": ["Under Review", "Archived"],
        "Under Review": ["Completed", "Archived"],
        "Completed": ["Archived"],
        "Archived": []
    }
    
    current_status = challenge.status
    target_status = update.status
    
    if target_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid transition from {current_status} to {target_status}"
        )
        
    challenge.status = target_status
    db.commit()
    db.refresh(challenge)
    return {"message": "Status updated successfully", "status": challenge.status}

@router.post("/challenges/{challenge_id}/join")
def join_challenge(
    challenge_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    if challenge.status != "Active":
        raise HTTPException(status_code=400, detail="Challenge is not Active")
        
    existing = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.challenge_id == challenge_id,
        ChallengeParticipation.employee_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already participating in this challenge")
        
    participation = ChallengeParticipation(
        challenge_id=challenge_id,
        employee_id=current_user.id,
        progress=0,
        approval_status="Pending"
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)
    return participation

@router.post("/challenge-participations/{participation_id}/approve")
def approve_challenge_participation(
    participation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role("Admin", "Manager"))
):
    participation = db.query(ChallengeParticipation).filter(ChallengeParticipation.id == participation_id).first()
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
        
    if participation.approval_status == "Approved":
        raise HTTPException(status_code=400, detail="Already approved")
        
    challenge = db.query(Challenge).filter(Challenge.id == participation.challenge_id).first()
    employee = db.query(Employee).filter(Employee.id == participation.employee_id).first()
    
    participation.approval_status = "Approved"
    participation.xp_awarded = challenge.xp_value
    
    employee.total_xp = (employee.total_xp or 0) + challenge.xp_value
    employee.total_points = (employee.total_points or 0) + challenge.xp_value
    
    db.commit() # Commit first so badge engine sees the updated counts
    db.refresh(employee)
    
    new_badges = check_and_award_badges(db, employee)
    db.commit()
    
    return {
        "message": "Approved", 
        "xp_awarded": challenge.xp_value, 
        "new_badges_awarded": len(new_badges)
    }

@router.post("/csr-participations/{participation_id}/approve")
def approve_csr_participation(
    participation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role("Admin", "Manager"))
):
    participation = db.query(EmployeeParticipation).filter(EmployeeParticipation.id == participation_id).first()
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
        
    if participation.approval_status == "Approved":
        raise HTTPException(status_code=400, detail="Already approved")
        
    org = db.query(Organization).first()
    if org and org.evidence_requirement_enabled and not participation.proof_file_url:
        raise HTTPException(status_code=400, detail="Proof file required for approval")
        
    employee = db.query(Employee).filter(Employee.id == participation.employee_id).first()
    
    participation.approval_status = "Approved"
    participation.approved_by_employee_id = current_user.id
    pts = participation.points_earned or 0
    
    employee.total_xp = (employee.total_xp or 0) + pts
    employee.total_points = (employee.total_points or 0) + pts
    
    db.commit()
    db.refresh(employee)
    
    new_badges = check_and_award_badges(db, employee)
    db.commit()
    
    return {
        "message": "Approved", 
        "points_awarded": pts, 
        "new_badges_awarded": len(new_badges)
    }

@router.post("/rewards/{reward_id}/redeem")
def redeem_reward(
    reward_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Atomic transaction
    reward = db.query(Reward).with_for_update().filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
        
    employee = db.query(Employee).with_for_update().filter(Employee.id == current_user.id).first()
    
    if reward.stock <= 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="Reward is out of stock")
        
    if (employee.total_points or 0) < reward.points_required:
        db.rollback()
        raise HTTPException(status_code=400, detail="Insufficient points")
        
    employee.total_points -= reward.points_required
    reward.stock -= 1
    
    db.commit()
    db.refresh(employee)
    return {"message": "Reward redeemed successfully", "remaining_points": employee.total_points}

class LeaderboardEntry(BaseModel):
    type: str
    id: uuid.UUID
    name: str
    xp: int

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    query = text("""
        SELECT 'employee' AS type, id, name, total_xp AS xp FROM employees
        UNION ALL
        SELECT 'department' AS type, departments.id, departments.name,
               COALESCE(SUM(employees.total_xp), 0) AS xp
        FROM departments LEFT JOIN employees ON employees.department_id = departments.id
        GROUP BY departments.id, departments.name
        ORDER BY xp DESC
        LIMIT 20
    """)
    
    results = db.execute(query).fetchall()
    return [{"type": r[0], "id": r[1], "name": r[2], "xp": int(r[3] or 0)} for r in results]
