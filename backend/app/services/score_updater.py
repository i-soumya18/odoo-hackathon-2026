from sqlalchemy import event
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.models import (
    CarbonTransaction, EmployeeParticipation, ChallengeParticipation,
    Audit, ComplianceIssue, DepartmentScore, Employee, Department, Organization,
    EnvironmentalGoal, ESGPolicy, PolicyAcknowledgement
)
from app.services.scoring_engine import ScoringEngine

def recalculate_department_score(session: Session, department_id: uuid.UUID):
    org = session.query(Organization).first()
    if not org:
        return
        
    dept = session.query(Department).filter(Department.id == department_id).first()
    if not dept:
        return
        
    emp_count = dept.employee_count
    
    # 1. Environmental
    goals = session.query(EnvironmentalGoal).filter(EnvironmentalGoal.department_id == department_id).all()
    goals_status = [g.status for g in goals]
    carbon_txs = session.query(CarbonTransaction).filter(CarbonTransaction.department_id == department_id).all()
    total_co2e = sum(tx.co2e_calculated for tx in carbon_txs)
    env_score = ScoringEngine.environmental_score(goals_status, total_co2e, emp_count)
    
    # 2. Social
    employees = session.query(Employee).filter(Employee.department_id == department_id).all()
    emp_ids = [e.id for e in employees]
    
    csr_count = session.query(EmployeeParticipation).filter(
        EmployeeParticipation.employee_id.in_(emp_ids),
        EmployeeParticipation.approval_status == "Approved"
    ).count() if emp_ids else 0
    
    challenge_count = session.query(ChallengeParticipation).filter(
        ChallengeParticipation.employee_id.in_(emp_ids),
        ChallengeParticipation.approval_status == "Approved"
    ).count() if emp_ids else 0
    
    social_score = ScoringEngine.social_score(csr_count, challenge_count, emp_count)
    
    # 3. Governance
    policy_ack_count = session.query(PolicyAcknowledgement).filter(
        PolicyAcknowledgement.employee_id.in_(emp_ids)
    ).count() if emp_ids else 0
    
    policies_requiring_ack = session.query(ESGPolicy).filter(ESGPolicy.requires_acknowledgement == True).count()
    
    audits = session.query(Audit).filter(Audit.department_id == department_id).all()
    audit_statuses = [a.status for a in audits]
    
    open_issues_records = session.query(ComplianceIssue).filter(
        ComplianceIssue.owner_employee_id.in_(emp_ids),
        ComplianceIssue.status == "Open"
    ).all() if emp_ids else []
    
    open_issues = [{"severity": issue.severity, "is_overdue": issue.is_overdue} for issue in open_issues_records]
    
    gov_score = ScoringEngine.governance_score(policy_ack_count, policies_requiring_ack, audit_statuses, open_issues)
    
    # 4. Total
    total_score = ScoringEngine.department_total_score(
        env_score, social_score, gov_score, 
        org.env_weight, org.social_weight, org.governance_weight
    )
    
    # Persist
    score_record = session.query(DepartmentScore).filter(
        DepartmentScore.department_id == department_id,
        DepartmentScore.period == "live"
    ).first()
    
    if not score_record:
        score_record = DepartmentScore(department_id=department_id, period="live")
        session.add(score_record)
        
    score_record.environmental_score = env_score
    score_record.social_score = social_score
    score_record.governance_score = gov_score
    score_record.total_score = total_score
    score_record.computed_at = datetime.utcnow()

# Event Listeners
def setup_listeners():
    @event.listens_for(Session, 'before_commit')
    def before_commit(session: Session):
        dept_ids_to_recalc = set()
        
        # Check all new, dirty, deleted objects
        for obj in list(session.new) + list(session.dirty) + list(session.deleted):
            if isinstance(obj, CarbonTransaction):
                dept_ids_to_recalc.add(obj.department_id)
            elif isinstance(obj, EmployeeParticipation) or isinstance(obj, ChallengeParticipation):
                # Use obj.employee_id directly if possible to avoid queries before flush
                # But we need department_id. We'll query it since it's safe if we don't autoflush yet.
                emp = session.query(Employee).filter(Employee.id == obj.employee_id).first()
                if emp:
                    dept_ids_to_recalc.add(emp.department_id)
            elif isinstance(obj, Audit):
                if obj.department_id:
                    dept_ids_to_recalc.add(obj.department_id)
            elif isinstance(obj, ComplianceIssue):
                emp = session.query(Employee).filter(Employee.id == obj.owner_employee_id).first()
                if emp:
                    dept_ids_to_recalc.add(emp.department_id)
                    
        if dept_ids_to_recalc:
            # Force flush so that count() and sum() queries see the newly added/modified rows
            session.flush()
            for dept_id in dept_ids_to_recalc:
                recalculate_department_score(session, dept_id)
