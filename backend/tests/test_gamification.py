import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import uuid

from app.main import app
from app.database import SessionLocal, get_db
from app.models import Employee, Badge, EmployeeBadge, Reward, Department, Organization
from app.services.badge_engine import check_and_award_badges

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_badge_engine_xp_threshold(db_session: Session):
    uid = str(uuid.uuid4())[:8]
    dept = Department(name=f"Test Dept {uid}", code=f"TEST_DEPT_{uid}")
    db_session.add(dept)
    db_session.commit()
    
    emp = Employee(name="Badge Tester", email=f"badge_{uid}@test.com", password_hash="hash", department_id=dept.id, role="Employee", total_xp=90)
    db_session.add(emp)
    
    badge = Badge(name="XP Master", unlock_rule_type="XP_THRESHOLD", unlock_rule_value=100)
    db_session.add(badge)
    db_session.commit()

    # Just below threshold
    awarded = check_and_award_badges(db_session, emp)
    assert len(awarded) == 0

    # At threshold
    emp.total_xp = 100
    db_session.commit()
    awarded = check_and_award_badges(db_session, emp)
    assert any(b.name == "XP Master" for b in awarded)
    db_session.commit()

    # Run twice - idempotent
    awarded_twice = check_and_award_badges(db_session, emp)
    assert len(awarded_twice) == 0

def test_reward_redemption_atomicity(db_session: Session):
    uid = str(uuid.uuid4())[:8]
    org = Organization(name=f"Test Org {uid}")
    db_session.add(org)
    dept = Department(name=f"Reward Dept {uid}", code=f"REW_DEPT_{uid}")
    db_session.add(dept)
    db_session.commit()
    
    emp = Employee(name="Reward Tester", email=f"reward_{uid}@test.com", password_hash="hash", department_id=dept.id, total_points=50, role="Employee")
    db_session.add(emp)
    
    reward = Reward(name="T-Shirt", points_required=100, stock=5)
    reward_zero_stock = Reward(name="Mug", points_required=10, stock=0)
    reward_success = Reward(name="Sticker", points_required=10, stock=5)
    db_session.add_all([reward, reward_zero_stock, reward_success])
    db_session.commit()

    # Override get_current_user dependency for testing
    def override_get_current_user():
        return emp

    from app.services.security import get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        # Case 1: Insufficient points (400)
        res1 = client.post(f"/rewards/{reward.id}/redeem")
        assert res1.status_code == 400
        assert "Insufficient points" in res1.json()["detail"]
        # Ensure no stock deducted
        db_session.refresh(reward)
        assert reward.stock == 5

        # Case 2: Zero stock (409)
        res2 = client.post(f"/rewards/{reward_zero_stock.id}/redeem")
        assert res2.status_code == 409
        assert "out of stock" in res2.json()["detail"]
        # Ensure points not deducted
        db_session.refresh(emp)
        assert emp.total_points == 50

        # Case 3: Success
        res3 = client.post(f"/rewards/{reward_success.id}/redeem")
        assert res3.status_code == 200
        db_session.refresh(emp)
        db_session.refresh(reward_success)
        assert emp.total_points == 40
        assert reward_success.stock == 4
    finally:
        app.dependency_overrides = {}
