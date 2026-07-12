import os
from dotenv import load_dotenv
load_dotenv()
from app.main import app
from fastapi.testclient import TestClient
from app.database import SessionLocal
from app.models import Department, Employee, EmployeeParticipation, CSRActivity
import uuid
from datetime import datetime

def main():
    client = TestClient(app)
    db = SessionLocal()
    
    print("--- 1. Testing GET /scores/org ---")
    resp_org = client.get("/scores/org")
    assert resp_org.status_code == 200, f"Error: {resp_org.text}"
    org_data = resp_org.json()
    print(org_data)
    for k in ["overall", "environmental", "social", "governance"]:
        assert 0 <= org_data[k] <= 100, f"{k} score {org_data[k]} out of bounds"
        
    print("\n--- 2. Testing GET /scores/departments ---")
    resp_dept = client.get("/scores/departments")
    assert resp_dept.status_code == 200
    depts = resp_dept.json()
    assert len(depts) == 5, f"Expected 5 departments, got {len(depts)}"
    
    prev_total = float('inf')
    for d in depts:
        print(d)
        assert 0 <= d["total"] <= 100
        assert 0 <= d["environmental"] <= 100
        assert 0 <= d["social"] <= 100
        assert 0 <= d["governance"] <= 100
        assert d["total"] <= prev_total, "Not sorted descending by total"
        prev_total = d["total"]
        
    print("\n--- 3. Triggering Recompute (Insert EmployeeParticipation) ---")
    mfg_dept = db.query(Department).filter(Department.name == "Manufacturing").first()
    mfg_emp = db.query(Employee).filter(Employee.department_id == mfg_dept.id).first()
    csr = db.query(CSRActivity).first()
    
    from app.services.score_updater import recalculate_department_score
    recalculate_department_score(db, mfg_dept.id)
    db.commit()
    
    depts = client.get("/scores/departments").json()
    mfg_initial_social = next(d["social"] for d in depts if d["department_name"] == "Manufacturing")
    print(f"Manufacturing initial true social score: {mfg_initial_social}")
    
    # Insert new participation
    new_part = EmployeeParticipation(
        employee_id=mfg_emp.id,
        csr_activity_id=csr.id,
        approval_status="Approved",
        completion_date=datetime.utcnow().date()
    )
    db.add(new_part)
    db.commit()
    
    print("Record inserted. Re-fetching scores...")
    depts_new = client.get("/scores/departments").json()
    mfg_new_social = next(d["social"] for d in depts_new if d["department_name"] == "Manufacturing")
    print(f"Manufacturing new social score: {mfg_new_social}")
    
    assert mfg_new_social > mfg_initial_social, "Social score did not increase after new CSR participation"
    print("\n--- All Validations Passed ---")

if __name__ == "__main__":
    main()
