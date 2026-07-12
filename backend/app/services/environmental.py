from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.models import CarbonTransaction, EnvironmentalGoal, Department

def get_carbon_trend(
    db: Session, 
    department_name: Optional[str] = None, 
    months: int = 3, 
    group_by_department: bool = False
) -> List[Dict[str, Any]]:
    """Returns CO2e totals, optionally by department and/or grouped."""
    query = db.query(CarbonTransaction)
    
    if department_name:
        query = query.join(Department).filter(Department.name.ilike(f"%{department_name}%"))
        
    cutoff_date = datetime.now() - timedelta(days=30 * months)
    query = query.filter(CarbonTransaction.transaction_date >= cutoff_date)
    
    if group_by_department:
        # Avoid full ORM loading for aggregation
        results = db.query(
            Department.name,
            func.sum(CarbonTransaction.co2e_calculated).label('total_co2e')
        ).join(
            CarbonTransaction, CarbonTransaction.department_id == Department.id
        ).filter(
            CarbonTransaction.transaction_date >= cutoff_date
        ).group_by(Department.name).order_by(func.sum(CarbonTransaction.co2e_calculated).desc()).all()
        
        return [{"department": r[0], "co2e_calculated": r[1]} for r in results]
    else:
        results = query.all()
        return [
            {
                "id": str(tx.id),
                "date": str(tx.transaction_date),
                "co2e": tx.co2e_calculated,
                "source": tx.activity_source
            } for tx in results
        ]

def get_goals_at_risk(db: Session, department_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns Environmental Goals whose status is At Risk."""
    query = db.query(EnvironmentalGoal).filter(
        EnvironmentalGoal.status == "At Risk"
    )
    if department_name:
        query = query.join(Department).filter(Department.name.ilike(f"%{department_name}%"))
        
    goals = query.all()
    # Also fetch goals trending behind pace
    trending_behind = []
    
    all_goals = db.query(EnvironmentalGoal).filter(EnvironmentalGoal.status == "Active")
    if department_name:
        all_goals = all_goals.join(Department).filter(Department.name.ilike(f"%{department_name}%"))
        
    for goal in all_goals.all():
        if goal.deadline and goal.current_value is not None:
            total_days = (goal.deadline - goal.created_at).days
            days_elapsed = (datetime.now() - goal.created_at).days
            if total_days > 0 and days_elapsed > 0:
                expected_progress = days_elapsed / total_days
                actual_progress = goal.current_value / goal.target_value if goal.target_value else 0
                if actual_progress < (expected_progress * 0.8): # 20% behind schedule
                    trending_behind.append(goal)
                    
    combined = list({g.id: g for g in (goals + trending_behind)}.values())
    return [
        {
            "id": str(g.id),
            "title": g.title,
            "target": g.target_value,
            "current": g.current_value,
            "deadline": str(g.deadline) if g.deadline else None,
            "status": "At Risk"
        } for g in combined
    ]
