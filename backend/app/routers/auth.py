from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, Department
from app.schemas.auth import EmployeeCreate, Token, EmployeeResponse
from app.services.security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=EmployeeResponse)
def signup(user_in: EmployeeCreate, db: Session = Depends(get_db)):
    # Check if user exists
    employee = db.query(Employee).filter(Employee.email == user_in.email).first()
    if employee:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Needs a default department if none specified in DB schema, wait, it's non-nullable. 
    # For signup, assign to an arbitrary department or fail. 
    # Let's assign to the first available department.
    default_dept = db.query(Department).first()
    if not default_dept:
        raise HTTPException(status_code=400, detail="No departments available")

    # Force role to 'Employee'
    new_employee = Employee(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        department_id=default_dept.id,
        role="Employee"
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.email == form_data.username).first()
    if not employee or not verify_password(form_data.password, employee.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Issue token
    access_token = create_access_token(data={"sub": str(employee.id), "role": employee.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=EmployeeResponse)
def read_users_me(current_user: Employee = Depends(get_current_user)):
    return current_user
