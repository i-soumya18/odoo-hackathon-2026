from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import uuid

from app.database import get_db
from app.models import CarbonTransaction, EmissionFactor, EnvironmentalGoal, Employee
from app.services.security import get_current_user

router = APIRouter(prefix="/environmental", tags=["environmental"])

class CarbonTransactionCreate(BaseModel):
    department_id: uuid.UUID
    emission_factor_id: uuid.UUID
    quantity: float
    activity_source: str = "Manual"
    transaction_date: date

class CarbonTransactionResponse(BaseModel):
    id: uuid.UUID
    department_id: uuid.UUID
    emission_factor_id: uuid.UUID
    activity_source: str
    quantity: float
    co2e_calculated: float
    transaction_date: date
    created_at: datetime
    
    class Config:
        from_attributes = True

class EmissionFactorResponse(BaseModel):
    id: uuid.UUID
    activity_type: str
    unit: str
    co2e_per_unit: float
    source: Optional[str]
    
    class Config:
        from_attributes = True

class EnvironmentalGoalResponse(BaseModel):
    id: uuid.UUID
    department_id: Optional[uuid.UUID]
    title: str
    target_metric: str
    target_value: float
    current_value: float
    deadline: Optional[date]
    status: str

    class Config:
        from_attributes = True

@router.post("/carbon-transactions", response_model=CarbonTransactionResponse)
def create_carbon_transaction(
    tx: CarbonTransactionCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    factor = db.query(EmissionFactor).filter(EmissionFactor.id == tx.emission_factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Emission Factor not found")
        
    co2e = float(factor.co2e_per_unit) * tx.quantity
    
    new_tx = CarbonTransaction(
        department_id=tx.department_id,
        emission_factor_id=tx.emission_factor_id,
        activity_source=tx.activity_source,
        quantity=tx.quantity,
        co2e_calculated=co2e,
        transaction_date=tx.transaction_date,
        created_by_employee_id=current_user.id
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    
    # Event listener in score_updater.py will catch this commit and trigger recalculation automatically.
    return new_tx

@router.get("/carbon-transactions", response_model=List[CarbonTransactionResponse])
def get_carbon_transactions(
    department_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CarbonTransaction)
    if department_id:
        query = query.filter(CarbonTransaction.department_id == department_id)
        
    return query.order_by(CarbonTransaction.transaction_date.desc()).limit(100).all()

@router.get("/emission-factors", response_model=List[EmissionFactorResponse])
def get_emission_factors(db: Session = Depends(get_db)):
    return db.query(EmissionFactor).filter(EmissionFactor.status == "Active").all()

@router.get("/goals", response_model=List[EnvironmentalGoalResponse])
def get_environmental_goals(
    department_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EnvironmentalGoal)
    if department_id:
        query = query.filter(
            (EnvironmentalGoal.department_id == department_id) | 
            (EnvironmentalGoal.department_id == None)
        )
    return query.order_by(EnvironmentalGoal.created_at.desc()).all()
