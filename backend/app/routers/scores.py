from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.models import Department, DepartmentScore, Organization

router = APIRouter(prefix="/scores", tags=["scores"])

class OrgScoreResponse(BaseModel):
    overall: float
    environmental: float
    social: float
    governance: float
    updated_at: datetime

class DepartmentScoreResponse(BaseModel):
    department_name: str
    total: float
    environmental: float
    social: float
    governance: float
    rank: int

@router.get("/org", response_model=OrgScoreResponse)
def get_org_scores(db: Session = Depends(get_db)):
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    scores = db.query(DepartmentScore).filter(DepartmentScore.period == "live").all()
    if not scores:
        return OrgScoreResponse(
            overall=0.0, environmental=0.0, social=0.0, governance=0.0,
            updated_at=datetime.utcnow()
        )
        
    depts = {d.id: d.employee_count for d in db.query(Department).all()}
    
    total_env = 0.0
    total_soc = 0.0
    total_gov = 0.0
    total_overall = 0.0
    total_employees = 0

    for s in scores:
        emp_count = depts.get(s.department_id, 0)
        total_env += s.environmental_score * emp_count
        total_soc += s.social_score * emp_count
        total_gov += s.governance_score * emp_count
        total_overall += s.total_score * emp_count
        total_employees += emp_count

    if total_employees == 0:
        count = len(scores)
        return OrgScoreResponse(
            overall=sum(s.total_score for s in scores) / count,
            environmental=sum(s.environmental_score for s in scores) / count,
            social=sum(s.social_score for s in scores) / count,
            governance=sum(s.governance_score for s in scores) / count,
            updated_at=datetime.utcnow()
        )
        
    return OrgScoreResponse(
        overall=total_overall / total_employees,
        environmental=total_env / total_employees,
        social=total_soc / total_employees,
        governance=total_gov / total_employees,
        updated_at=datetime.utcnow()
    )

@router.get("/departments", response_model=List[DepartmentScoreResponse])
def get_department_scores(db: Session = Depends(get_db)):
    # Join Department and DepartmentScore
    results = db.query(Department, DepartmentScore)\
        .join(DepartmentScore, Department.id == DepartmentScore.department_id)\
        .filter(DepartmentScore.period == "live")\
        .order_by(DepartmentScore.total_score.desc())\
        .all()
        
    response = []
    for rank, (dept, score) in enumerate(results, start=1):
        response.append(DepartmentScoreResponse(
            department_name=dept.name,
            total=score.total_score,
            environmental=score.environmental_score,
            social=score.social_score,
            governance=score.governance_score,
            rank=rank
        ))
    return response
