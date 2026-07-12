# EcoSphere: ESG Operating System

> **EcoSphere turns ESG from a quarterly PDF into a live number your organization plays, tracks, and asks questions of — every day.**

## Overview

EcoSphere is a single ESG (Environmental, Social, Governance) Operating System designed to make sustainability and compliance interactive, measurable, and engaging. Instead of disconnected reporting tools, EcoSphere provides one live, weighted score with drill-downs by department and ESG pillars. It features gamified employee participation and an AI Copilot that explains the "why" behind the numbers, grounded in real transactional data.

## Key Features

- **Live ESG Scoring Engine:** An overall score calculated as a weighted average of Department Total Scores (Environmental 40%, Social 30%, Governance 30%).
- **Environmental Tracking:** Track emission factors, product ESG profiles, carbon transactions, and monitor environmental goals.
- **Social Engagement:** Manage CSR activities, employee participation, and view diversity metrics.
- **Governance & Compliance:** Keep track of ESG policies, acknowledgments, audits, and severity-tagged compliance issues.
- **Gamification:** Boost participation with Challenges, earn XP, unlock Badges, redeem Rewards, and compete on Leaderboards.
- **AI ESG Copilot:** A dedicated, grounded AI assistant powered by the Gemini API that answers questions about your organization's ESG data (e.g., "Which department emits the most CO₂?") by securely querying real records.

## Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS (Light Odoo-aligned theme)
- **Charts:** Recharts

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy + Alembic
- **AI Integration:** Gemini API (Function calling for the AI Copilot)
- **Authentication:** JWT (Email/Password, Server-side Role Enforcement)

## Target Users

| Role | Primary Job To Be Done |
|---|---|
| **Admin** | Configure organization, weights, policies, categories; oversee the organization-wide ESG picture. |
| **Manager** | Approve CSR/Challenge participation, own compliance issues, track department score. |
| **Employee** | Log participation, earn XP/Badges, redeem Rewards, query the Copilot. |

## Project Structure

```text
ecosphere/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routers/         # API endpoints (environmental, social, governance, gamification, copilot, auth)
│   │   ├── services/        # Business logic (scoring engine, badge engine, copilot engine)
│   │   ├── schemas/         # Pydantic models
│   │   └── main.py
│   ├── alembic/             # Database migrations
│   └── seed.py              # Mock data seeding
├── frontend/
│   └── src/
│       ├── pages/           # Application views
│       ├── components/      # Reusable UI components
│       └── lib/             # Utility functions
└── docs/                    # Architecture, design, and specification documents
```

## Getting Started

*(Development instructions based on the stack)*

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt` (or equivalent).
3. Set up your `.env` file with your Database URL, Gemini API Key, and JWT Secret.
4. Run migrations: `alembic upgrade head`
5. Seed the database: `python seed.py`
6. Start the server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

---
*Built for the Odoo Hackathon 2026.*