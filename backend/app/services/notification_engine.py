from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.models import Notification

def create_notification(
    session: Session, 
    employee_id: uuid.UUID, 
    type: str, 
    message: str
) -> Notification:
    notif = Notification(
        employee_id=employee_id,
        type=type,
        message=message,
        read=False,
        created_at=datetime.utcnow()
    )
    session.add(notif)
    return notif

def notify_challenge_approval(session: Session, employee_id: uuid.UUID, challenge_title: str, xp: int):
    return create_notification(
        session, employee_id, "CHALLENGE_APPROVED",
        f"Your participation in '{challenge_title}' was approved! You earned {xp} XP."
    )

def notify_csr_approval(session: Session, employee_id: uuid.UUID, activity_title: str, points: int):
    return create_notification(
        session, employee_id, "CSR_APPROVED",
        f"Your participation in '{activity_title}' was approved! You earned {points} Points."
    )

def notify_compliance_issue_raised(session: Session, employee_id: uuid.UUID, description: str, severity: str):
    return create_notification(
        session, employee_id, "COMPLIANCE_ISSUE_RAISED",
        f"A new {severity} severity compliance issue has been assigned to you: {description}"
    )

def notify_compliance_issue_overdue(session: Session, employee_id: uuid.UUID, description: str):
    return create_notification(
        session, employee_id, "COMPLIANCE_ISSUE_OVERDUE",
        f"OVERDUE: Your compliance issue '{description}' is past its due date."
    )

def notify_policy_reminder(session: Session, employee_id: uuid.UUID, policy_title: str):
    return create_notification(
        session, employee_id, "POLICY_REMINDER",
        f"Reminder: Please review and acknowledge the policy '{policy_title}'."
    )
