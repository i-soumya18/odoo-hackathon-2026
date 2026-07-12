from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import uuid

from app.database import get_db
from app.models import ESGPolicy, Audit, ComplianceIssue, Employee, Department
from app.services.security import get_current_user

router = APIRouter(prefix="/governance", tags=["governance"])

class ESGPolicyResponse(BaseModel):
    id: uuid.UUID
    title: str
    category: str
    status: str
    requires_acknowledgement: bool
    
    class Config:
        from_attributes = True

class AuditResponse(BaseModel):
    id: uuid.UUID
    title: str
    department_name: Optional[str]
    auditor_name: Optional[str]
    date: date
    findings_summary: Optional[str]
    status: str
    
class ComplianceIssueResponse(BaseModel):
    id: uuid.UUID
    severity: str
    description: str
    status: str
    due_date: date
    is_overdue: bool
    owner_name: Optional[str]
    
class ComplianceIssueStatusUpdate(BaseModel):
    status: str

@router.get("/policies", response_model=List[ESGPolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    return db.query(ESGPolicy).all()

@router.get("/audits", response_model=List[AuditResponse])
def get_audits(db: Session = Depends(get_db)):
    audits = db.query(Audit).order_by(Audit.date.desc()).all()
    results = []
    
    # Simple manual join mapping for hackathon
    depts = {d.id: d.name for d in db.query(Department).all()}
    emps = {e.id: e.name for e in db.query(Employee).all()}
    
    for a in audits:
        results.append(AuditResponse(
            id=a.id,
            title=a.title,
            department_name=depts.get(a.department_id) if a.department_id else "Org-wide",
            auditor_name=emps.get(a.auditor_employee_id) if a.auditor_employee_id else "Unassigned",
            date=a.date,
            findings_summary=a.findings_summary,
            status=a.status
        ))
    return results

@router.get("/compliance-issues", response_model=List[ComplianceIssueResponse])
def get_compliance_issues(db: Session = Depends(get_db)):
    issues = db.query(ComplianceIssue).order_by(ComplianceIssue.due_date.asc()).all()
    emps = {e.id: e.name for e in db.query(Employee).all()}
    
    results = []
    for issue in issues:
        # Re-evaluate is_overdue strictly against current date in case time has passed since seeding
        is_overdue = issue.status != "Resolved" and issue.due_date < date.today()
        
        results.append(ComplianceIssueResponse(
            id=issue.id,
            severity=issue.severity,
            description=issue.description,
            status=issue.status,
            due_date=issue.due_date,
            is_overdue=is_overdue,
            owner_name=emps.get(issue.owner_employee_id)
        ))
    return results

@router.patch("/compliance-issues/{id}/status", response_model=ComplianceIssueResponse)
def update_compliance_issue_status(
    id: uuid.UUID,
    update: ComplianceIssueStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    issue = db.query(ComplianceIssue).filter(ComplianceIssue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    valid_statuses = ["Open", "In Progress", "Resolved"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")
        
    issue.status = update.status
    db.commit()
    
    # Return updated issue (score_updater.py will catch the change automatically)
    is_overdue = issue.status != "Resolved" and issue.due_date < date.today()
    emps = {e.id: e.name for e in db.query(Employee).all()}
    
    return ComplianceIssueResponse(
        id=issue.id,
        severity=issue.severity,
        description=issue.description,
        status=issue.status,
        due_date=issue.due_date,
        is_overdue=is_overdue,
        owner_name=emps.get(issue.owner_employee_id)
    )
