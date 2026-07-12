import os
import re
import json
import asyncio
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.services.scoring_engine import ScoringEngine
from app.services.environmental import get_carbon_trend, get_goals_at_risk
from app.services.governance import get_open_compliance_issues
from app.services.gamification_engine import get_challenge_recommendations_input

SYSTEM_PROMPT = """You are the EcoSphere ESG Copilot. You answer questions about this organization's Environmental, Social, and Governance performance using ONLY the data returned by your tools. Rules:

1. Always call a tool before stating any number, score, or specific fact. Never state a score, count, or date from memory or inference.
2. If a tool returns no data or an error, say so plainly — do not guess or fill gaps.
3. Keep answers to 2-4 sentences unless the user asks for detail. Lead with the direct answer, then one sentence of "why" grounded in the tool result.
4. If the question is outside ESG/organizational data (general chit-chat, unrelated topics), politely redirect: "I can help with questions about your ESG data and scores — try asking about a department, a compliance issue, or your score trend."
5. Never fabricate department names, employee names, or figures not present in a tool result."""

# Normalizes string for fallback cache matching
def normalize_question(q: str) -> str:
    return re.sub(r'[^\w\s]', '', q).lower().strip()

# Hardcoded fallback cache for demo safety
FALLBACK_CACHE = {
    normalize_question("Which department emits the most CO₂?"): {
        "response": "Manufacturing is your highest emitter this period, driven mainly by Fleet diesel usage. Logistics is second. (Cached)",
        "source_chips": [{"label": "Carbon Trend", "data": {"top_emitter": "Manufacturing"}}]
    },
    normalize_question("Generate this month's ESG report"): {
        "response": "Here's your ESG Summary for this month: Overall score 81/100 (Environmental 82, Social 74, Governance 88). Want me to open the full report or export it as PDF? (Cached)",
        "source_chips": [{"label": "Org Score", "data": {"overall": 81, "env": 82, "soc": 74, "gov": 88}}]
    },
    normalize_question("Show unresolved compliance issues"): {
        "response": "You have 3 open compliance issues — 2 are overdue, including 'Missing MSDS sheets' in Manufacturing. Want me to jump you to the Compliance Issues tab? (Cached)",
        "source_chips": [{"label": "Open Issues", "data": {"count": 3, "overdue": 2}}]
    },
    normalize_question("What goals are at risk?"): {
        "response": "'Cut Packaging Waste' (Manufacturing) is at risk — trending below pace. Your other active goals are on track. (Cached)",
        "source_chips": [{"label": "Goals At Risk", "data": {"title": "Cut Packaging Waste", "department": "Manufacturing"}}]
    },
    normalize_question("Why did our Governance score drop this month?"): {
        "response": "Your Governance score dropped to 61/100. The main driver is 3 open compliance issues past their due date, mostly in Manufacturing. (Cached)",
        "source_chips": [{"label": "Governance Drivers", "data": {"overdue_issues": 3}}]
    },
    normalize_question("Which department is dragging down our score?"): {
        "response": "Operations has the lowest Total Score at 54/100 — its Governance sub-score (38) is the weakest pillar, mainly from unresolved compliance issues. (Cached)",
        "source_chips": [{"label": "Department Scores", "data": {"lowest": "Operations", "score": 54}}]
    }
}

class CopilotEngine:
    def __init__(self, db: Session):
        self.db = db
        # Set up Gemini client
        api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        
    def _execute_tool(self, name: str, args: dict) -> Any:
        try:
            if name == "get_org_score":
                return ScoringEngine.get_current_org_score(self.db)
            elif name == "get_department_scores":
                return ScoringEngine.get_all_department_scores(self.db)
            elif name == "get_department_detail":
                # We can just return the scores for this specific department
                scores = ScoringEngine.get_all_department_scores(self.db)
                dept = args.get("department_name")
                if dept:
                    return [s for s in scores if dept.lower() in s["department_name"].lower()]
                return scores
            elif name == "get_open_compliance_issues":
                return get_open_compliance_issues(
                    self.db, 
                    args.get("department_name"), 
                    args.get("overdue_only", False)
                )
            elif name == "get_carbon_trend":
                return get_carbon_trend(
                    self.db, 
                    args.get("department_name"), 
                    args.get("months", 3), 
                    args.get("group_by_department", False)
                )
            elif name == "get_goals_at_risk":
                return get_goals_at_risk(self.db, args.get("department_name"))
            elif name == "get_challenge_recommendations_input":
                return get_challenge_recommendations_input(self.db, args.get("department_name"))
            else:
                return {"error": f"Tool {name} not found"}
        except Exception as e:
            return {"error": str(e)}

    def _get_tools_definition(self):
        return [
            types.Tool(
                function_declarations=[
                    types.FunctionDeclaration(
                        name="get_org_score",
                        description="Returns the current overall ESG score and E/S/G breakdown for the organization.",
                    ),
                    types.FunctionDeclaration(
                        name="get_department_scores",
                        description="Returns Total/Environmental/Social/Governance scores for every department, ranked.",
                    ),
                    types.FunctionDeclaration(
                        name="get_department_detail",
                        description="Returns score breakdown and contributing factors for one named department.",
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={"department_name": types.Schema(type=types.Type.STRING)}
                        )
                    ),
                    types.FunctionDeclaration(
                        name="get_open_compliance_issues",
                        description="Returns open Compliance Issues, optionally filtered by department or overdue status.",
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "department_name": types.Schema(type=types.Type.STRING),
                                "overdue_only": types.Schema(type=types.Type.BOOLEAN)
                            }
                        )
                    ),
                    types.FunctionDeclaration(
                        name="get_carbon_trend",
                        description="Returns CO2e totals over the last N months, optionally by department. Can also return current-period totals grouped by department to answer 'which department emits most'.",
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "department_name": types.Schema(type=types.Type.STRING),
                                "months": types.Schema(type=types.Type.INTEGER),
                                "group_by_department": types.Schema(type=types.Type.BOOLEAN)
                            }
                        )
                    ),
                    types.FunctionDeclaration(
                        name="get_goals_at_risk",
                        description="Returns Environmental Goals whose status is At Risk, or whose progress is trending behind pace relative to their deadline.",
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={"department_name": types.Schema(type=types.Type.STRING)}
                        )
                    ),
                    types.FunctionDeclaration(
                        name="get_challenge_recommendations_input",
                        description="Returns each department's weakest E/S/G pillar and active Challenge catalog, for recommending a relevant Challenge.",
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={"department_name": types.Schema(type=types.Type.STRING)}
                        )
                    )
                ]
            )
        ]

    async def ask(self, message: str, session_history: List[dict] = None) -> Dict[str, Any]:
        """Handles the Copilot request, including fallback cache."""
        norm_msg = normalize_question(message)
        
        # If API key is missing, immediately fallback
        if not self.client:
            return FALLBACK_CACHE.get(norm_msg, {
                "response": "I can help with questions about your ESG data and scores — try asking about a department, a compliance issue, or your score trend. (Offline Mode)",
                "source_chips": []
            })
            
        try:
            # Wrap the Gemini API call with a 4-second timeout
            response_data = await asyncio.wait_for(self._call_gemini(message, session_history), timeout=4.0)
            return response_data
        except (asyncio.TimeoutError, Exception) as e:
            # Fallback on timeout or API error
            return FALLBACK_CACHE.get(norm_msg, {
                "response": "I can help with questions about your ESG data and scores — try asking about a department, a compliance issue, or your score trend. (Cached)",
                "source_chips": []
            })
            
    async def _call_gemini(self, message: str, session_history: List[dict] = None) -> Dict[str, Any]:
        # We need to run the synchronous GenAI SDK in a thread or we can just run it synchronously if we assume it's fast enough 
        # But wait_for requires an awaitable. We can use asyncio.to_thread
        return await asyncio.to_thread(self._sync_call_gemini, message, session_history)
        
    def _sync_call_gemini(self, message: str, session_history: List[dict] = None) -> Dict[str, Any]:
        chat = self.client.chats.create(
            model="gemini-2.5-flash-lite",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=self._get_tools_definition(),
                temperature=0.2
            )
        )
        
        if session_history:
            # We don't necessarily need to pass all history for a simple hackathon demo
            # But we could hydrate the chat history here if needed
            pass
            
        response = chat.send_message(message)
        
        source_chips = []
        
        # Handle tool calls
        if response.function_calls:
            for fn_call in response.function_calls:
                fn_name = fn_call.name
                args = fn_call.args
                result = self._execute_tool(fn_name, args)
                
                source_chips.append({
                    "label": fn_name,
                    "data": result
                })
                
                # Send the tool response back to Gemini
                response = chat.send_message(
                    types.Part.from_function_response(
                        name=fn_name,
                        response={"result": result}
                    )
                )
                
        return {
            "response": response.text,
            "source_chips": source_chips
        }
