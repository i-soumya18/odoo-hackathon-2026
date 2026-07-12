from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Department, DepartmentScore, Organization

class ScoringEngine:
    """
    Pure, unit-testable functions for calculating ESG scores.
    """

    @staticmethod
    def environmental_score(goals_status: List[str], total_co2e: float, employee_count: int) -> float:
        """
        Calculates environmental score.
        Formula: max(0, min(100, base_goal_score - carbon_penalty))
        - base_goal_score: average of goal status (Achieved=100, On Track=80, At Risk=40, Missed=0). Default 80.
        - carbon_penalty: (total_co2e / max(employee_count, 1)) * 2
        """
        if not goals_status:
            base_goal_score = 80.0
        else:
            status_map = {"Achieved": 100, "On Track": 80, "At Risk": 40, "Missed": 0}
            scores = [status_map.get(s, 0) for s in goals_status]
            base_goal_score = sum(scores) / len(scores)

        emp_count = max(employee_count, 1)
        carbon_penalty = (total_co2e / emp_count) * 2

        score = base_goal_score - carbon_penalty
        return max(0.0, min(100.0, score))

    @staticmethod
    def social_score(approved_csr_count: int, approved_challenge_count: int, employee_count: int) -> float:
        """
        Calculates social score.
        Formula: max(0, min(100, 40 + (csr_rate * 0.3) + (challenge_rate * 0.3)))
        - csr_rate: (approved_csr_count / emp_count) * 100
        - challenge_rate: (approved_challenge_count / emp_count) * 100
        """
        emp_count = max(employee_count, 1)
        csr_rate = (approved_csr_count / emp_count) * 100.0
        challenge_rate = (approved_challenge_count / emp_count) * 100.0

        score = 40.0 + (csr_rate * 0.3) + (challenge_rate * 0.3)
        return max(0.0, min(100.0, score))

    @staticmethod
    def governance_score(policy_ack_count: int, policies_requiring_ack: int, audit_statuses: List[str], open_issues: List[dict]) -> float:
        """
        Calculates governance score.
        Formula: max(0, min(100, (policy_ack_rate * 50) + (audit_score * 50) - compliance_penalty))
        - policy_ack_rate: (policy_ack_count / (emp_count * policies_requiring_ack)) if policies > 0 else 1.0
        - audit_score: average of audit statuses (Completed/Closed=100, Under Review=80, In Progress=60, Planned=40)
        - compliance_penalty: Critical=20, High=15, Medium=10, Low=5. Doubled if is_overdue.
        """
        # policy_ack_rate logic has been simplified since we only pass the fraction components
        # If policies_requiring_ack (total possible acks) is 0, rate is 100%
        if policies_requiring_ack == 0:
            policy_ack_rate = 1.0
        else:
            policy_ack_rate = policy_ack_count / policies_requiring_ack
            policy_ack_rate = min(1.0, policy_ack_rate) # Cap at 100%

        if not audit_statuses:
            audit_score = 100.0
        else:
            audit_map = {"Completed": 100, "Closed": 100, "Under Review": 80, "In Progress": 60, "Planned": 40}
            scores = [audit_map.get(s, 0) for s in audit_statuses]
            audit_score = sum(scores) / len(scores)

        base_gov = (policy_ack_rate * 50.0) + (audit_score * 0.5)

        severity_map = {"Critical": 20, "High": 15, "Medium": 10, "Low": 5}
        compliance_penalty = 0.0
        for issue in open_issues:
            base_pen = severity_map.get(issue.get("severity", "Low"), 5)
            if issue.get("is_overdue"):
                base_pen *= 2
            compliance_penalty += base_pen

        score = base_gov - compliance_penalty
        return max(0.0, min(100.0, score))

    @staticmethod
    def department_total_score(env_score: float, social_score: float, gov_score: float,
                               env_weight: int, social_weight: int, gov_weight: int) -> float:
        """
        Calculates the weighted average department score.
        """
        total_weight = env_weight + social_weight + gov_weight
        if total_weight == 0:
            return 0.0
        
        weighted = (env_score * env_weight) + (social_score * social_weight) + (gov_score * gov_weight)
        return weighted / total_weight

    @staticmethod
    def org_score(departments: List[dict]) -> float:
        """
        Calculates the overall organization score.
        departments = [{"score": 85.0, "employee_count": 20}, ...]
        """
        if not departments:
            return 0.0
        
        total_employees = sum(d["employee_count"] for d in departments)
        if total_employees == 0:
            # simple average
            return sum(d["score"] for d in departments) / len(departments)
            
        weighted_sum = sum(d["score"] * d["employee_count"] for d in departments)
        return weighted_sum / total_employees

    @staticmethod
    def get_current_org_score(db: Session) -> Dict[str, Any]:
        org = db.query(Organization).first()
        if not org:
            return {"overall": 0.0, "environmental": 0.0, "social": 0.0, "governance": 0.0}
            
        scores = db.query(DepartmentScore).filter(DepartmentScore.period == "live").all()
        if not scores:
            return {"overall": 0.0, "environmental": 0.0, "social": 0.0, "governance": 0.0}
            
        depts = {d.id: d.employee_count for d in db.query(Department).all()}
        
        total_env, total_soc, total_gov, total_overall, total_employees = 0.0, 0.0, 0.0, 0.0, 0
        for s in scores:
            emp_count = depts.get(s.department_id, 0)
            total_env += s.environmental_score * emp_count
            total_soc += s.social_score * emp_count
            total_gov += s.governance_score * emp_count
            total_overall += s.total_score * emp_count
            total_employees += emp_count

        if total_employees == 0:
            count = len(scores)
            return {
                "overall": sum(s.total_score for s in scores) / count,
                "environmental": sum(s.environmental_score for s in scores) / count,
                "social": sum(s.social_score for s in scores) / count,
                "governance": sum(s.governance_score for s in scores) / count,
            }
            
        return {
            "overall": total_overall / total_employees,
            "environmental": total_env / total_employees,
            "social": total_soc / total_employees,
            "governance": total_gov / total_employees,
        }

    @staticmethod
    def get_all_department_scores(db: Session) -> List[Dict[str, Any]]:
        results = db.query(Department, DepartmentScore)\
            .join(DepartmentScore, Department.id == DepartmentScore.department_id)\
            .filter(DepartmentScore.period == "live")\
            .order_by(DepartmentScore.total_score.desc())\
            .all()
            
        response = []
        for rank, (dept, score) in enumerate(results, start=1):
            response.append({
                "department_name": dept.name,
                "total": score.total_score,
                "environmental": score.environmental_score,
                "social": score.social_score,
                "governance": score.governance_score,
                "rank": rank
            })
        return response
