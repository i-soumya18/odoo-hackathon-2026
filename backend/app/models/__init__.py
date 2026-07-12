import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = 'organizations'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    env_weight = Column(Integer, default=40)
    social_weight = Column(Integer, default=30)
    governance_weight = Column(Integer, default=30)
    auto_emission_calc_enabled = Column(Boolean, default=True)
    evidence_requirement_enabled = Column(Boolean, default=True)
    badge_auto_award_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Department(Base):
    __tablename__ = 'departments'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    head_employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id', use_alter=True, name='fk_department_head_employee'), nullable=True)
    parent_department_id = Column(UUID(as_uuid=True), ForeignKey('departments.id'), nullable=True)
    employee_count = Column(Integer, default=0)
    status = Column(String, default="Active") # Active/Inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Employee(Base):
    __tablename__ = 'employees'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey('departments.id'), nullable=False)
    role = Column(String, nullable=False) # Admin/Manager/Employee
    status = Column(String, default="Active") # Active/Inactive
    total_xp = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Category(Base):
    __tablename__ = 'categories'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # CSR_ACTIVITY / CHALLENGE
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmissionFactor(Base):
    __tablename__ = 'emission_factors'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_type = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    co2e_per_unit = Column(Float, nullable=False)
    source = Column(String)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProductESGProfile(Base):
    __tablename__ = 'product_esg_profiles'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_name = Column(String, nullable=False)
    carbon_footprint_per_unit = Column(Float, nullable=False)
    recyclable = Column(Boolean, default=False)
    sustainability_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EnvironmentalGoal(Base):
    __tablename__ = 'environmental_goals'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey('departments.id'), nullable=True)
    title = Column(String, nullable=False)
    target_metric = Column(String, nullable=False)
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0)
    deadline = Column(Date, nullable=False)
    status = Column(String, default="On Track") # On Track / At Risk / Achieved / Missed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ESGPolicy(Base):
    __tablename__ = 'esg_policies'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False) # Environmental/Social/Governance
    body = Column(Text, nullable=False)
    version = Column(String, nullable=False)
    status = Column(String, default="Draft") # Draft/Published/Archived
    requires_acknowledgement = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Badge(Base):
    __tablename__ = 'badges'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    icon = Column(String)
    unlock_rule_type = Column(String, nullable=False) # XP_THRESHOLD / CHALLENGES_COMPLETED / CSR_COUNT
    unlock_rule_value = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Reward(Base):
    __tablename__ = 'rewards'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    points_required = Column(Integer, nullable=False)
    stock = Column(Integer, nullable=False)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CarbonTransaction(Base):
    __tablename__ = 'carbon_transactions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey('departments.id'), nullable=False)
    emission_factor_id = Column(UUID(as_uuid=True), ForeignKey('emission_factors.id'), nullable=False)
    activity_source = Column(String, nullable=False) # Manual / Purchase / Manufacturing / Expense / Fleet
    quantity = Column(Float, nullable=False)
    co2e_calculated = Column(Float, nullable=False)
    transaction_date = Column(Date, nullable=False)
    created_by_employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CSRActivity(Base):
    __tablename__ = 'csr_activities'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id'), nullable=False)
    description = Column(String)
    department_id = Column(UUID(as_uuid=True), ForeignKey('departments.id'), nullable=True)
    date = Column(Date, nullable=False)
    status = Column(String, default="Planned") # Planned/Active/Completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmployeeParticipation(Base):
    __tablename__ = 'employee_participations'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    csr_activity_id = Column(UUID(as_uuid=True), ForeignKey('csr_activities.id'), nullable=False)
    proof_file_url = Column(String, nullable=True)
    approval_status = Column(String, default="Pending") # Pending/Approved/Rejected
    approved_by_employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=True)
    points_earned = Column(Integer, default=0)
    completion_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Challenge(Base):
    __tablename__ = 'challenges'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id'), nullable=False)
    description = Column(String)
    xp_value = Column(Integer, nullable=False)
    difficulty = Column(String, nullable=False) # Easy/Medium/Hard
    evidence_required = Column(Boolean, default=False)
    deadline = Column(Date, nullable=False)
    status = Column(String, default="Draft") # Draft/Active/Under Review/Completed/Archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChallengeParticipation(Base):
    __tablename__ = 'challenge_participations'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id = Column(UUID(as_uuid=True), ForeignKey('challenges.id'), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    progress = Column(Integer, default=0) # 0-100
    proof_file_url = Column(String, nullable=True)
    approval_status = Column(String, default="Pending") # Pending/Approved/Rejected
    xp_awarded = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PolicyAcknowledgement(Base):
    __tablename__ = 'policy_acknowledgements'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey('esg_policies.id'), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Audit(Base):
    __tablename__ = 'audits'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey('departments.id'), nullable=True)
    auditor_employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    date = Column(Date, nullable=False)
    findings_summary = Column(Text)
    status = Column(String, default="Planned") # Planned/In Progress/Under Review/Completed/Closed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ComplianceIssue(Base):
    __tablename__ = 'compliance_issues'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey('audits.id'), nullable=True)
    severity = Column(String, nullable=False) # Low/Medium/High/Critical
    description = Column(Text, nullable=False)
    owner_employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String, default="Open") # Open/In Progress/Resolved
    is_overdue = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DepartmentScore(Base):
    __tablename__ = 'department_scores'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey('departments.id'), nullable=False)
    period = Column(String, nullable=False) # e.g. "2026-07" or "live"
    environmental_score = Column(Float, default=0.0)
    social_score = Column(Float, default=0.0)
    governance_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    type = Column(String, nullable=False) # COMPLIANCE_ISSUE_RAISED / CSR_APPROVAL_DECISION / etc.
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmployeeBadge(Base):
    __tablename__ = 'employee_badges'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id'), nullable=False)
    badge_id = Column(UUID(as_uuid=True), ForeignKey('badges.id'), nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
