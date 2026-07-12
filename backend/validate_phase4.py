import os
from dotenv import load_dotenv
load_dotenv()
from app.main import app
from fastapi.testclient import TestClient
from app.database import SessionLocal
from app.models import (
    Employee, Challenge, ChallengeParticipation, EmployeeParticipation, 
    Organization, Badge, Notification
)

def main():
    client = TestClient(app)
    db = SessionLocal()
    
    admin_emp = db.query(Employee).filter(Employee.role == "Admin").first()
    if not admin_emp:
        admin_emp = db.query(Employee).filter(Employee.role == "Manager").first()

    # Create token manually since seed.py uses dummy password hashes
    from app.services.security import create_access_token
    token = create_access_token({"sub": str(admin_emp.id), "role": admin_emp.role})
    
    # Set auth header globally for client
    client.headers.update({"Authorization": f"Bearer {token}"})
    
    print("\n--- 1. Testing Challenge Participation (Join & Approve) ---")
    active_chal = db.query(Challenge).filter(Challenge.status == "Active").first()
    if not active_chal:
        print("No active challenge found.")
        return
        
    res = client.post(f"/challenges/{active_chal.id}/join")
    assert res.status_code == 200, f"Join failed: {res.text}"
    pending_cp_id = res.json()["id"]
    
    pending_cp = db.query(ChallengeParticipation).filter(ChallengeParticipation.id == pending_cp_id).first()
        
    emp = db.query(Employee).filter(Employee.id == pending_cp.employee_id).first()
    initial_xp = emp.total_xp or 0
    
    res = client.post(f"/challenge-participations/{pending_cp.id}/approve")
    assert res.status_code == 200, f"Approval failed: {res.text}"
    
    data = res.json()
    print(f"Approval response: {data}")
    
    db.refresh(emp)
    new_xp = emp.total_xp
    print(f"Employee XP increased from {initial_xp} to {new_xp} (+{new_xp - initial_xp})")
    assert new_xp > initial_xp
    assert new_xp - initial_xp == data["xp_awarded"]
    
    if data["new_badges_awarded"] > 0:
        notifs = db.query(Notification).filter(
            Notification.employee_id == emp.id, 
            Notification.type == "BADGE_UNLOCKED"
        ).all()
        print(f"Found {len(notifs)} badge unlock notifications.")
        assert len(notifs) >= data["new_badges_awarded"]
        
    print("\n--- 2. Testing CSR Participation Approval without Proof ---")
    org = db.query(Organization).first()
    org.evidence_requirement_enabled = True
    db.commit()
    
    pending_csr = db.query(EmployeeParticipation).filter(
        EmployeeParticipation.approval_status == "Pending",
        EmployeeParticipation.proof_file_url.is_(None)
    ).first()
    
    if pending_csr:
        res = client.post(f"/csr-participations/{pending_csr.id}/approve")
        print(f"CSR Approval without proof response: {res.status_code} - {res.text}")
        assert res.status_code == 400
        assert "Proof file required" in res.text
    else:
        print("Could not find a pending CSR without proof to test.")

    print("\n--- 3. Testing GET /leaderboard ---")
    res = client.get("/leaderboard")
    assert res.status_code == 200
    leaderboard = res.json()
    
    types_found = set(entry["type"] for entry in leaderboard)
    print(f"Found types in leaderboard: {types_found}")
    assert "employee" in types_found
    assert "department" in types_found
    
    # Check sorting
    prev_xp = float("inf")
    for entry in leaderboard:
        assert entry["xp"] <= prev_xp, "Leaderboard not sorted by XP descending"
        prev_xp = entry["xp"]
        
    print(f"Top entry: {leaderboard[0]['name']} ({leaderboard[0]['type']}) - {leaderboard[0]['xp']} XP")
    print("\n--- All Validations Passed ---")

if __name__ == "__main__":
    main()
