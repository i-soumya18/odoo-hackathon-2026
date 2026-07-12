import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import uuid

from app.main import app
from app.database import get_db, Base
from app.models import Employee, Department
from app.services.security import get_password_hash, create_access_token

# For testing, we can use the same neon db but roll back transactions, or just create unique data.
DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    # Setup
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Ensure there's a department for signup to work
    dept = session.query(Department).first()
    if not dept:
        dept = Department(name="Test Dept", code="TST")
        session.add(dept)
        session.commit()
        
    yield session
    
    # Teardown
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_signup_enforces_employee_role(client, db_session):
    unique_email = f"test_{uuid.uuid4()}@example.com"
    payload = {
        "name": "Test User",
        "email": unique_email,
        "password": "pw",
        "role": "Admin" # Attempt to inject admin
    }
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email
    assert data["role"] == "Employee" # MUST BE Employee

def test_login_success(client, db_session):
    unique_email = f"login_{uuid.uuid4()}@example.com"
    dept = db_session.query(Department).first()
    emp = Employee(name="Login Test", email=unique_email, password_hash=get_password_hash("pw"), role="Employee", department_id=dept.id)
    db_session.add(emp)
    db_session.commit()
    
    response = client.post("/auth/login", data={"username": unique_email, "password": "pw"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid(client, db_session):
    response = client.post("/auth/login", data={"username": "wrong@example.com", "password": "pw"})
    assert response.status_code == 401

def test_me_unauthorized(client):
    response = client.get("/auth/me")
    assert response.status_code == 401

def test_promote_non_admin(client, db_session):
    dept = db_session.query(Department).first()
    emp = Employee(name="Emp", email=f"emp_{uuid.uuid4()}@example.com", password_hash=get_password_hash("pw"), role="Employee", department_id=dept.id)
    target = Employee(name="Target", email=f"target_{uuid.uuid4()}@example.com", password_hash=get_password_hash("pw"), role="Employee", department_id=dept.id)
    db_session.add_all([emp, target])
    db_session.commit()
    
    token = create_access_token({"sub": str(emp.id), "role": emp.role})
    response = client.post(
        f"/employees/{target.id}/promote",
        json={"role": "Manager"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403

def test_promote_admin(client, db_session):
    dept = db_session.query(Department).first()
    admin = Employee(name="Admin", email=f"admin_{uuid.uuid4()}@example.com", password_hash=get_password_hash("pw"), role="Admin", department_id=dept.id)
    target = Employee(name="Target", email=f"target_{uuid.uuid4()}@example.com", password_hash=get_password_hash("pw"), role="Employee", department_id=dept.id)
    db_session.add_all([admin, target])
    db_session.commit()
    
    token = create_access_token({"sub": str(admin.id), "role": admin.role})
    response = client.post(
        f"/employees/{target.id}/promote",
        json={"role": "Manager"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == "Manager"
    
    # Confirm in db
    db_session.refresh(target)
    assert target.role == "Manager"
