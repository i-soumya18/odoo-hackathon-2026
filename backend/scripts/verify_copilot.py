import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Employee
from app.services.security import create_access_token

client = TestClient(app)

def get_auth_token():
    db = SessionLocal()
    try:
        admin = db.query(Employee).filter(Employee.role == "Admin").first()
        if not admin:
            print("No admin found for testing.")
            return None
        return create_access_token(data={"sub": str(admin.id)})
    finally:
        db.close()

def main():
    token = get_auth_token()
    if not token:
        return
        
    client.headers.update({"Authorization": f"Bearer {token}"})

    questions = [
        "Which department emits the most CO₂?",
        "Generate this month's ESG report",
        "Show unresolved compliance issues",
        "What goals are at risk?",
        "Why did our Governance score drop this month?",
        "Which department is dragging down our score?",
        "what's the weather today" # off-topic
    ]

    for q in questions:
        print(f"\nQ: {q}")
        res = client.post("/copilot/ask", json={"message": q})
        if res.status_code != 200:
            print(f"Error: {res.status_code} - {res.text}")
            continue
            
        data = res.json()
        print(f"A: {data['response']}")
        print(f"Chips: {json.dumps(data['source_chips'], indent=2)}")

if __name__ == "__main__":
    main()
