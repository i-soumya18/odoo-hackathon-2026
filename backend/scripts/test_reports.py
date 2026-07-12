import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_reports():
    res = client.get("/reports/esg-summary/pdf")
    if res.status_code == 200:
        print(f"PDF Size: {len(res.content)} bytes")
        with open("test_esg_summary.pdf", "wb") as f:
            f.write(res.content)
        print("Successfully saved test_esg_summary.pdf")
    else:
        print(f"PDF Error: {res.status_code} - {res.text}")
        
    res_csv = client.get("/reports/custom/csv?module=carbon")
    if res_csv.status_code == 200:
        print(f"CSV Size: {len(res_csv.content)} bytes")
        print(f"CSV Preview: {res_csv.text[:200]}")
    else:
        print(f"CSV Error: {res_csv.status_code} - {res_csv.text}")

if __name__ == "__main__":
    test_reports()
