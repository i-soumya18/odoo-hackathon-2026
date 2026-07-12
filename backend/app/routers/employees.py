from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee
from app.schemas.auth import EmployeeResponse, PromoteRequest
from app.services.security import require_role

router = APIRouter(prefix="/employees", tags=["employees"])

@router.post("/{employee_id}/promote", response_model=EmployeeResponse)
def promote_employee(
    employee_id: str, 
    promote_req: PromoteRequest,
    db: Session = Depends(get_db),
    current_admin: Employee = Depends(require_role("Admin"))
):
    if promote_req.role not in ["Manager"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    employee.role = promote_req.role
    db.commit()
    db.refresh(employee)
    return employee
