from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    employee_id: Optional[str] = None
    role: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    department_id: uuid.UUID
    total_xp: int
    total_points: int

    class Config:
        from_attributes = True

class PromoteRequest(BaseModel):
    role: str
