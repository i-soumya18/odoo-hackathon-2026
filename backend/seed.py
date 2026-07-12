import os
import uuid
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import (
    Organization, Department, Employee, Category, EmissionFactor,
    ProductESGProfile, EnvironmentalGoal, ESGPolicy, Badge, Reward,
    CarbonTransaction, CSRActivity, EmployeeParticipation, Challenge,
    ChallengeParticipation, PolicyAcknowledgement, Audit, ComplianceIssue,
    DepartmentScore, Notification, EmployeeBadge
)

load_dotenv()
DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def reset_db(db):
    print("Clearing existing data...")
    db.query(EmployeeBadge).delete()
    db.query(Notification).delete()
    db.query(DepartmentScore).delete()
    db.query(ComplianceIssue).delete()
    db.query(Audit).delete()
    db.query(PolicyAcknowledgement).delete()
    db.query(ChallengeParticipation).delete()
    db.query(Challenge).delete()
    db.query(EmployeeParticipation).delete()
    db.query(CSRActivity).delete()
    db.query(CarbonTransaction).delete()
    db.query(Reward).delete()
    db.query(Badge).delete()
    db.query(ESGPolicy).delete()
    db.query(EnvironmentalGoal).delete()
    db.query(ProductESGProfile).delete()
    db.query(EmissionFactor).delete()
    db.query(Category).delete()
    db.query(Employee).delete()
    db.query(Department).delete()
    db.query(Organization).delete()
    db.commit()

def seed_db():
    db = SessionLocal()
    reset_db(db)
    
    print("Seeding Organization...")
    org = Organization(name="EcoSphere Demo Org", env_weight=40, social_weight=30, governance_weight=30)
    db.add(org)
    
    print("Seeding Departments...")
    depts = [
        Department(name="Sales", code="SAL", employee_count=20),
        Department(name="Manufacturing", code="MFG", employee_count=150),
        Department(name="Logistics", code="LOG", employee_count=45),
        Department(name="Corporate", code="COR", employee_count=30),
        Department(name="R&D", code="RND", employee_count=12),
    ]
    db.add_all(depts)
    db.commit()

    print("Seeding Employees...")
    # Admin
    admin = Employee(name="System Admin", email="admin@demo.org", password_hash="hash", department_id=depts[3].id, role="Admin")
    # Managers
    m_nair = Employee(name="S. Nair", email="snair@demo.org", password_hash="hash", department_id=depts[1].id, role="Manager")
    m_iyer = Employee(name="R. Iyer", email="riyer@demo.org", password_hash="hash", department_id=depts[3].id, role="Manager")
    m_sal = Employee(name="Sales Lead", email="slead@demo.org", password_hash="hash", department_id=depts[0].id, role="Manager")
    m_log = Employee(name="Log Lead", email="llead@demo.org", password_hash="hash", department_id=depts[2].id, role="Manager")
    
    # Regular Employees
    e_priya = Employee(name="Priya", email="priya@demo.org", password_hash="hash", department_id=depts[4].id, role="Employee", total_xp=500, total_points=200)
    e_aditi = Employee(name="Aditi Rao", email="aditi@demo.org", password_hash="hash", department_id=depts[4].id, role="Employee", total_xp=3505, total_points=1200)
    e_karan = Employee(name="Karan Shah", email="karan@demo.org", password_hash="hash", department_id=depts[0].id, role="Employee", total_xp=2100, total_points=500)
    
    employees = [admin, m_nair, m_iyer, m_sal, m_log, e_priya, e_aditi, e_karan]
    for i in range(7):
        employees.append(Employee(name=f"Emp {i+1}", email=f"emp{i+1}@demo.org", password_hash="hash", department_id=random.choice(depts).id, role="Employee", total_xp=random.randint(100, 1000)))
    db.add_all(employees)
    db.commit()

    # Assign heads
    depts[0].head_employee_id = m_sal.id
    depts[1].head_employee_id = m_nair.id
    depts[2].head_employee_id = m_log.id
    depts[3].head_employee_id = m_iyer.id
    db.commit()

    print("Seeding Categories...")
    csr_cats = [
        Category(name="Community", type="CSR_ACTIVITY"),
        Category(name="Environment", type="CSR_ACTIVITY"),
        Category(name="Education", type="CSR_ACTIVITY")
    ]
    chal_cats = [
        Category(name="Commute", type="CHALLENGE"),
        Category(name="Waste", type="CHALLENGE"),
        Category(name="Energy", type="CHALLENGE")
    ]
    db.add_all(csr_cats + chal_cats)
    db.commit()

    print("Seeding Emission Factors...")
    ef_elec = EmissionFactor(activity_type="Electricity kWh", unit="kWh", co2e_per_unit=0.4)
    ef_diesel = EmissionFactor(activity_type="Fleet Diesel L", unit="L", co2e_per_unit=2.7)
    ef_air = EmissionFactor(activity_type="Air Travel km", unit="km", co2e_per_unit=0.15)
    ef_gas = EmissionFactor(activity_type="Natural Gas m3", unit="m3", co2e_per_unit=2.0)
    ef_waste = EmissionFactor(activity_type="Waste kg", unit="kg", co2e_per_unit=0.5)
    db.add_all([ef_elec, ef_diesel, ef_air, ef_gas, ef_waste])
    db.commit()

    print("Seeding Badges and Rewards...")
    badges = [
        Badge(name="Eco Starter", unlock_rule_type="XP_THRESHOLD", unlock_rule_value=100),
        Badge(name="Carbon Champion", unlock_rule_type="CHALLENGES_COMPLETED", unlock_rule_value=3),
        Badge(name="CSR Hero", unlock_rule_type="CSR_COUNT", unlock_rule_value=2),
        Badge(name="Overachiever", unlock_rule_type="XP_THRESHOLD", unlock_rule_value=3000)
    ]
    rewards = [
        Reward(name="Company Swag", points_required=500, stock=50),
        Reward(name="Extra PTO Day", points_required=2000, stock=10),
        Reward(name="Gift Card $50", points_required=1000, stock=20)
    ]
    db.add_all(badges + rewards)
    db.commit()

    print("Seeding Transactions and Activities...")
    today = datetime.now().date()
    for _ in range(15):
        qty = random.uniform(10, 1000)
        ef = random.choice([ef_elec, ef_diesel, ef_gas, ef_waste])
        db.add(CarbonTransaction(
            department_id=random.choice([depts[1], depts[2]]).id,
            emission_factor_id=ef.id,
            activity_source="Manual",
            quantity=qty,
            co2e_calculated=qty * ef.co2e_per_unit,
            transaction_date=today - timedelta(days=random.randint(1, 90)),
            created_by_employee_id=m_nair.id
        ))

    csr1 = CSRActivity(title="Tree Plantation", category_id=csr_cats[1].id, date=today - timedelta(days=5), status="Completed")
    csr2 = CSRActivity(title="Blood Donation", category_id=csr_cats[0].id, date=today + timedelta(days=10), status="Planned")
    csr3 = CSRActivity(title="Beach Cleanup", category_id=csr_cats[1].id, date=today - timedelta(days=2), status="Completed")
    csr4 = CSRActivity(title="ESG Workshop", category_id=csr_cats[2].id, date=today - timedelta(days=1), status="Completed")
    db.add_all([csr1, csr2, csr3, csr4])
    db.commit()

    db.add(EmployeeParticipation(employee_id=e_aditi.id, csr_activity_id=csr1.id, approval_status="Approved", proof_file_url="url"))
    db.add(EmployeeParticipation(employee_id=e_karan.id, csr_activity_id=csr1.id, approval_status="Approved", proof_file_url="url"))
    # One without proof file
    db.add(EmployeeParticipation(employee_id=e_priya.id, csr_activity_id=csr3.id, approval_status="Pending", proof_file_url=None))
    db.commit()

    print("Seeding Challenges...")
    chal1 = Challenge(title="Cycle to Work", category_id=chal_cats[0].id, xp_value=200, difficulty="Medium", deadline=today + timedelta(days=10), status="Active")
    chal2 = Challenge(title="Zero Waste Week", category_id=chal_cats[1].id, xp_value=300, difficulty="Hard", deadline=today + timedelta(days=15), status="Active")
    chal3 = Challenge(title="Energy Saver", category_id=chal_cats[2].id, xp_value=100, difficulty="Easy", deadline=today - timedelta(days=2), status="Completed")
    db.add_all([chal1, chal2, chal3])
    db.commit()

    print("Seeding Audits and Compliance...")
    audit1 = Audit(title="Q3 Factory Audit", department_id=depts[1].id, auditor_employee_id=m_nair.id, date=today - timedelta(days=20), findings_summary="3 minor issues", status="Completed")
    audit2 = Audit(title="Logistics Compliance", department_id=depts[2].id, auditor_employee_id=m_iyer.id, date=today - timedelta(days=5), findings_summary="Pending review", status="Under Review")
    db.add_all([audit1, audit2])
    db.commit()

    c1 = ComplianceIssue(audit_id=audit1.id, severity="Medium", description="Waste sorting failed", owner_employee_id=m_nair.id, due_date=today - timedelta(days=2), status="Open", is_overdue=True)
    c2 = ComplianceIssue(audit_id=audit1.id, severity="High", description="Exhaust filter expired", owner_employee_id=m_nair.id, due_date=today - timedelta(days=5), status="Open", is_overdue=True)
    c3 = ComplianceIssue(audit_id=audit2.id, severity="Low", description="Missing documentation", owner_employee_id=m_log.id, due_date=today + timedelta(days=10), status="Open", is_overdue=False)
    db.add_all([c1, c2, c3])
    db.commit()

    print("Seeding Scores...")
    for dept in depts:
        db.add(DepartmentScore(
            department_id=dept.id,
            period="live",
            environmental_score=random.uniform(60, 90),
            social_score=random.uniform(60, 90),
            governance_score=random.uniform(60, 90),
            total_score=random.uniform(60, 90)
        ))
    db.commit()

    print("\n--- Seed Complete ---")
    tables = [
        ("Organization", Organization), ("Department", Department), ("Employee", Employee),
        ("EmissionFactor", EmissionFactor), ("Badge", Badge), ("Reward", Reward),
        ("CarbonTransaction", CarbonTransaction), ("CSRActivity", CSRActivity),
        ("Challenge", Challenge), ("Audit", Audit), ("ComplianceIssue", ComplianceIssue),
        ("DepartmentScore", DepartmentScore)
    ]
    for name, model in tables:
        count = db.query(model).count()
        print(f"{name}: {count} rows")

if __name__ == "__main__":
    seed_db()
