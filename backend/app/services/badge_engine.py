from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.models import (
    Employee, Badge, EmployeeBadge, Notification, 
    ChallengeParticipation, EmployeeParticipation
)

def check_and_award_badges(session: Session, employee: Employee) -> List[Badge]:
    """
    Evaluates all badges for an employee and awards newly qualified ones.
    Returns a list of newly awarded Badges.
    """
    # 1. Get all badges
    all_badges = session.query(Badge).all()
    if not all_badges:
        return []

    # 2. Get already awarded badges
    awarded_badge_ids = {
        eb.badge_id for eb in session.query(EmployeeBadge).filter(EmployeeBadge.employee_id == employee.id).all()
    }

    newly_awarded = []

    # Get employee stats
    total_xp = employee.total_xp or 0
    
    # Completed challenges
    challenges_completed = session.query(ChallengeParticipation).filter(
        ChallengeParticipation.employee_id == employee.id,
        ChallengeParticipation.approval_status == "Approved"
    ).count()

    # Completed CSR
    csr_count = session.query(EmployeeParticipation).filter(
        EmployeeParticipation.employee_id == employee.id,
        EmployeeParticipation.approval_status == "Approved"
    ).count()

    # 3. Evaluate rules
    for badge in all_badges:
        if badge.id in awarded_badge_ids:
            continue

        qualifies = False
        if badge.unlock_rule_type == "XP_THRESHOLD":
            if total_xp >= badge.unlock_rule_value:
                qualifies = True
        elif badge.unlock_rule_type == "CHALLENGES_COMPLETED":
            if challenges_completed >= badge.unlock_rule_value:
                qualifies = True
        elif badge.unlock_rule_type == "CSR_COUNT":
            if csr_count >= badge.unlock_rule_value:
                qualifies = True

        if qualifies:
            # Award it
            new_eb = EmployeeBadge(
                employee_id=employee.id,
                badge_id=badge.id,
                awarded_at=datetime.utcnow()
            )
            session.add(new_eb)
            
            # Create notification
            new_notif = Notification(
                employee_id=employee.id,
                type="BADGE_UNLOCKED",
                message=f"Congratulations! You've unlocked the '{badge.name}' badge.",
                read=False,
                created_at=datetime.utcnow()
            )
            session.add(new_notif)
            
            newly_awarded.append(badge)

    return newly_awarded
