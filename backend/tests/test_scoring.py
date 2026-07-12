import pytest
from app.services.scoring_engine import ScoringEngine

def test_environmental_score_no_goals():
    # If no goals, base is 80.
    # Total CO2e = 100, employees = 10 -> penalty = (100 / 10) * 2 = 20
    # Expected: 80 - 20 = 60
    assert ScoringEngine.environmental_score([], 100, 10) == 60.0

def test_environmental_score_with_goals():
    # Goals: Achieved(100), On Track(80) -> base = 90
    # Total CO2e = 50, employees = 5 -> penalty = (50 / 5) * 2 = 20
    # Expected: 90 - 20 = 70
    assert ScoringEngine.environmental_score(["Achieved", "On Track"], 50, 5) == 70.0

def test_environmental_score_bounds():
    # High penalty -> caps at 0
    assert ScoringEngine.environmental_score(["Missed"], 500, 1) == 0.0
    # No penalty, high base -> caps at 100
    assert ScoringEngine.environmental_score(["Achieved"], 0, 1) == 100.0

def test_social_score_normal():
    # 5 employees, 2 csr, 3 challenges
    # csr_rate = 2/5 = 40.0
    # chal_rate = 3/5 = 60.0
    # Expected: 40 + (40 * 0.3) + (60 * 0.3) = 40 + 12 + 18 = 70
    assert ScoringEngine.social_score(2, 3, 5) == 70.0

def test_social_score_bounds():
    # 0 participation -> base 40
    assert ScoringEngine.social_score(0, 0, 10) == 40.0
    # high participation -> caps at 100
    assert ScoringEngine.social_score(200, 200, 1) == 100.0

def test_governance_score_normal():
    # 10 employees, 2 policies requiring ack -> 20 possible acks
    # policy_ack_count = 10 -> rate = 0.5 (50%)
    # audits: Completed (100), In Progress (60) -> avg 80
    # Base: (0.5 * 50) + (80 * 0.5) = 25 + 40 = 65
    # Open issues: 1 High (15), 1 Low overdue (5*2=10) -> penalty = 25
    # Expected: 65 - 25 = 40
    open_issues = [
        {"severity": "High", "is_overdue": False},
        {"severity": "Low", "is_overdue": True}
    ]
    assert ScoringEngine.governance_score(10, 20, ["Completed", "In Progress"], open_issues) == 40.0

def test_governance_score_bounds():
    # perfect
    assert ScoringEngine.governance_score(10, 10, ["Completed"], []) == 100.0
    # terrible
    open_issues = [{"severity": "Critical", "is_overdue": True} for _ in range(10)]
    assert ScoringEngine.governance_score(0, 10, ["Planned"], open_issues) == 0.0

def test_department_total_score():
    # 50, 60, 70 with weights 40/30/30
    # Expected: (50*40 + 60*30 + 70*30) / 100 = (2000 + 1800 + 2100) / 100 = 5900 / 100 = 59
    assert ScoringEngine.department_total_score(50, 60, 70, 40, 30, 30) == 59.0

def test_org_score():
    depts = [
        {"score": 50, "employee_count": 10},
        {"score": 100, "employee_count": 40}
    ]
    # Expected: (50*10 + 100*40) / 50 = (500 + 4000) / 50 = 4500 / 50 = 90
    assert ScoringEngine.org_score(depts) == 90.0
