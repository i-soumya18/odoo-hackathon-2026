from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.models import Department, DepartmentScore, Organization, CarbonTransaction, EmployeeParticipation, ComplianceIssue

router = APIRouter(prefix="/scores", tags=["scores"])

class OrgScoreResponse(BaseModel):
    total_score: float
    environmental_score: float
    social_score: float
    governance_score: float
    updated_at: datetime

class DepartmentScoreResponse(BaseModel):
    id: uuid.UUID
    name: str
    total_score: float
    environmental: float
    social: float
    governance: float
    rank: int

@router.get("/organization", response_model=OrgScoreResponse)
def get_org_scores(db: Session = Depends(get_db)):
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    scores = db.query(DepartmentScore).filter(DepartmentScore.period == "live").all()
    if not scores:
        return OrgScoreResponse(
            total_score=0.0, environmental_score=0.0, social_score=0.0, governance_score=0.0,
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
            total_score=sum(s.total_score for s in scores) / count,
            environmental_score=sum(s.environmental_score for s in scores) / count,
            social_score=sum(s.social_score for s in scores) / count,
            governance_score=sum(s.governance_score for s in scores) / count,
            updated_at=datetime.utcnow()
        )
        
    return OrgScoreResponse(
        total_score=total_overall / total_employees,
        environmental_score=total_env / total_employees,
        social_score=total_soc / total_employees,
        governance_score=total_gov / total_employees,
        updated_at=datetime.utcnow()
    )

@router.get("/departments", response_model=List[DepartmentScoreResponse])
def get_department_scores(db: Session = Depends(get_db)):
    results = db.query(Department, DepartmentScore)\
        .join(DepartmentScore, Department.id == DepartmentScore.department_id)\
        .filter(DepartmentScore.period == "live")\
        .order_by(DepartmentScore.total_score.desc())\
        .all()
        
    response = []
    for rank, (dept, score) in enumerate(results, start=1):
        response.append(DepartmentScoreResponse(
            id=dept.id,
            name=dept.name,
            total_score=score.total_score,
            environmental=score.environmental_score,
            social=score.social_score,
            governance=score.governance_score,
            rank=rank
        ))
    return response

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    # total carbon
    carbon_sum = db.query(func.sum(CarbonTransaction.co2e_calculated)).scalar() or 0.0
    
    # open compliance issues
    issues_count = db.query(func.count(ComplianceIssue.id)).filter(ComplianceIssue.status != "Resolved").scalar() or 0
    
    # CSR participation rate (fake for now, usually would be participants / total employees)
    total_participations = db.query(func.count(EmployeeParticipation.id)).scalar() or 0
    
    return {
        "total_carbon": float(carbon_sum),
        "open_compliance_issues": issues_count,
        "csr_participation_rate": min(100.0, total_participations * 5.0) # mock rate
    }
