from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, date
import uuid
import random

from app.database import get_db
from app.models import Organization, EmissionFactor, CarbonTransaction, Employee, Department
from app.services.security import get_current_user

router = APIRouter(prefix="/erp", tags=["erp_simulator"])

class ERPTxRequest(BaseModel):
    department_id: uuid.UUID
    activity_type: str  # e.g., "Fleet", "Purchase", "Manufacturing", "Expense"
    amount: float
    description: str

@router.post("/simulate-transaction")
def simulate_erp_transaction(
    tx: ERPTxRequest,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    org = db.query(Organization).first()
    if not org or not org.auto_emission_calc_enabled:
        return {"message": "Auto-emission calculation is disabled. Transaction logged in ERP, but no carbon calculated."}

    # Map activity_type to an EmissionFactor
    # In a real scenario, this would be a complex mapping. Here we mock it.
    factor = db.query(EmissionFactor).filter(EmissionFactor.activity_type.ilike(f"%{tx.activity_type}%")).first()
    
    # If not found by exact type, just pick the first one as a fallback for the simulation
    if not factor:
        factor = db.query(EmissionFactor).first()
        
    if not factor:
        raise HTTPException(status_code=400, detail="No emission factors available to map this transaction.")

    # Convert amount to CO2e
    # For simulation, we assume 'amount' scales linearly with the factor
    quantity = tx.amount
    co2e = float(factor.co2e_per_unit) * quantity

    new_tx = CarbonTransaction(
        department_id=tx.department_id,
        emission_factor_id=factor.id,
        activity_source=tx.activity_type,
        quantity=quantity,
        co2e_calculated=co2e,
        transaction_date=date.today(),
        created_by_employee_id=current_user.id
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    
    return {
        "message": "ERP Transaction simulated and mapped to Carbon Transaction",
        "carbon_transaction_id": new_tx.id,
        "co2e_calculated": co2e
    }
