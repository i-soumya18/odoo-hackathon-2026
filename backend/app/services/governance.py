from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.models import ComplianceIssue, Department, Audit

def get_open_compliance_issues(
    db: Session, 
    department_name: Optional[str] = None, 
    overdue_only: bool = False
) -> List[Dict[str, Any]]:
    """Returns open Compliance Issues."""
    query = db.query(ComplianceIssue).filter(ComplianceIssue.status == "Open")
    
    if overdue_only:
        query = query.filter(ComplianceIssue.due_date < datetime.now())
        
    if department_name:
        query = query.join(Audit).join(Department).filter(Department.name.ilike(f"%{department_name}%"))
        
    results = query.all()
    
    return [
        {
            "id": str(issue.id),
            "severity": issue.severity,
            "description": issue.description,
            "due_date": str(issue.due_date) if issue.due_date else None,
            "is_overdue": issue.is_overdue or (issue.due_date and issue.due_date < datetime.now().date())
        } for issue in results
    ]
