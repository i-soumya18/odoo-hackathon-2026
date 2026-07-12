from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models import Employee
from app.services.security import get_current_user
from app.services.copilot_engine import CopilotEngine

router = APIRouter(prefix="/copilot", tags=["copilot"])

class CopilotRequest(BaseModel):
    message: str
    session_history: Optional[List[dict]] = None

class SourceChip(BaseModel):
    label: str
    data: Dict[str, Any]

class CopilotResponse(BaseModel):
    response: str
    source_chips: List[SourceChip]

@router.post("/ask", response_model=CopilotResponse)
async def ask_copilot(
    request: CopilotRequest,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Answers ESG questions using Gemini and tools."""
    engine = CopilotEngine(db)
    
    result = await engine.ask(request.message, request.session_history)
    
    return CopilotResponse(
        response=result.get("response", "An error occurred."),
        source_chips=[SourceChip(**chip) for chip in result.get("source_chips", [])]
    )
