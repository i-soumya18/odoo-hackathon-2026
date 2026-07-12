from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.models import Challenge, DepartmentScore, Department

def get_challenge_recommendations_input(db: Session, department_name: Optional[str] = None) -> Dict[str, Any]:
    """Returns weak pillars and active challenges for recommendations."""
    # Find weakest pillar for the department (or overall if None)
    query = db.query(DepartmentScore).filter(DepartmentScore.period == "live")
    
    if department_name:
        query = query.join(Department).filter(Department.name.ilike(f"%{department_name}%"))
        
    scores = query.all()
    
    if not scores:
        return {"weakest_pillar": "Unknown", "active_challenges": []}
        
    # Aggregate scores
    avg_env = sum(s.environmental_score for s in scores) / len(scores)
    avg_soc = sum(s.social_score for s in scores) / len(scores)
    avg_gov = sum(s.governance_score for s in scores) / len(scores)
    
    pillars = {
        "Environmental": avg_env,
        "Social": avg_soc,
        "Governance": avg_gov
    }
    
    weakest_pillar = min(pillars, key=pillars.get)
    
    # Get active challenges
    active_challenges = db.query(Challenge).filter(Challenge.status == "Active").all()
    
    challenges_data = [
        {
            "id": str(c.id),
            "title": c.title,
            "difficulty": c.difficulty,
            "xp_value": c.xp_value
        } for c in active_challenges
    ]
    
    return {
        "weakest_pillar": weakest_pillar,
        "weakest_score": pillars[weakest_pillar],
        "active_challenges": challenges_data
    }
