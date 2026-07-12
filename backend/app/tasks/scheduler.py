import threading
import time
from datetime import date
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import ComplianceIssue
from app.services.notification_engine import notify_compliance_issue_overdue

def run_scheduler():
    while True:
        try:
            db: Session = SessionLocal()
            # Find open issues that are past due date and haven't been flagged as overdue yet
            issues = db.query(ComplianceIssue).filter(
                ComplianceIssue.status != "Resolved",
                ComplianceIssue.due_date < date.today(),
                ComplianceIssue.is_overdue == False
            ).all()

            for issue in issues:
                issue.is_overdue = True
                notify_compliance_issue_overdue(db, issue.owner_employee_id, issue.description)
                db.commit()
            
            db.close()
        except Exception as e:
            print("Scheduler error:", e)
        
        # Check every 60 seconds (simulated for hackathon, normally would be daily)
        time.sleep(60)

def start_scheduler():
    t = threading.Thread(target=run_scheduler, daemon=True)
    t.start()
