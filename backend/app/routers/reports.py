from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from datetime import datetime
import csv
import io
from fpdf import FPDF

from app.database import get_db
from app.services.security import get_current_user
from app.models import Employee, DepartmentScore, Department, CarbonTransaction, ComplianceIssue

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/esg-summary/pdf")
def get_esg_summary_pdf(db: Session = Depends(get_db)):
    # Fetch live scores
    scores = db.query(DepartmentScore).filter(DepartmentScore.period == "live").all()
    if not scores:
        raise HTTPException(status_code=404, detail="No score data available")
        
    depts = {d.id: d.name for d in db.query(Department).all()}
    
    # Calculate Org Averages (Simple average for hackathon pdf)
    overall = sum(s.total_score for s in scores) / len(scores)
    env = sum(s.environmental_score for s in scores) / len(scores)
    soc = sum(s.social_score for s in scores) / len(scores)
    gov = sum(s.governance_score for s in scores) / len(scores)
    
    # Generate PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=16, style="B")
    pdf.cell(200, 10, txt="EcoSphere ESG Summary Report", ln=True, align="C")
    
    pdf.set_font("Helvetica", size=10)
    pdf.cell(200, 10, txt=f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align="C")
    pdf.ln(10)
    
    # Org Scores
    pdf.set_font("Helvetica", size=14, style="B")
    pdf.cell(200, 10, txt="Organization Overall Scores", ln=True)
    pdf.set_font("Helvetica", size=12)
    pdf.cell(200, 10, txt=f"Overall ESG Score: {overall:.1f} / 100", ln=True)
    pdf.cell(200, 10, txt=f"Environmental: {env:.1f} | Social: {soc:.1f} | Governance: {gov:.1f}", ln=True)
    pdf.ln(10)
    
    # Department Breakdown
    pdf.set_font("Helvetica", size=14, style="B")
    pdf.cell(200, 10, txt="Department Breakdown", ln=True)
    
    pdf.set_font("Helvetica", size=10, style="B")
    # Table Header
    col_w = [60, 30, 30, 30, 30]
    headers = ["Department", "Total", "Env", "Social", "Gov"]
    for i in range(len(headers)):
        pdf.cell(col_w[i], 10, txt=headers[i], border=1, align="C")
    pdf.ln()
    
    pdf.set_font("Helvetica", size=10)
    for s in sorted(scores, key=lambda x: x.total_score, reverse=True):
        d_name = depts.get(s.department_id, "Unknown")
        pdf.cell(col_w[0], 10, txt=d_name, border=1)
        pdf.cell(col_w[1], 10, txt=f"{s.total_score:.1f}", border=1, align="C")
        pdf.cell(col_w[2], 10, txt=f"{s.environmental_score:.1f}", border=1, align="C")
        pdf.cell(col_w[3], 10, txt=f"{s.social_score:.1f}", border=1, align="C")
        pdf.cell(col_w[4], 10, txt=f"{s.governance_score:.1f}", border=1, align="C")
        pdf.ln()
        
    pdf_bytes = pdf.output(dest="S")
    
    return Response(
        content=bytes(pdf_bytes), 
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ESG_Summary.pdf"}
    )

@router.get("/custom/csv")
def get_custom_report_csv(
    module: str = Query(..., description="carbon or compliance"),
    department_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    if module == "carbon":
        query = db.query(CarbonTransaction)
        if department_id:
            query = query.filter(CarbonTransaction.department_id == department_id)
        
        writer.writerow(["Transaction ID", "Date", "Source", "Quantity", "CO2e Calculated", "Department ID"])
        for tx in query.all():
            writer.writerow([str(tx.id), tx.transaction_date, tx.activity_source, tx.quantity, tx.co2e_calculated, str(tx.department_id)])
            
    elif module == "compliance":
        query = db.query(ComplianceIssue)
        # Note: In a real app we'd join to Audit to filter by department_id.
        writer.writerow(["Issue ID", "Severity", "Description", "Status", "Due Date", "Is Overdue"])
        for issue in query.all():
            writer.writerow([str(issue.id), issue.severity, issue.description, issue.status, issue.due_date, issue.is_overdue])
    else:
        raise HTTPException(status_code=400, detail="Unsupported module for custom export")
        
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=CustomReport_{module}.csv"}
    )
