from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, employees, scores, gamification, copilot, environmental, social, reports, governance, notifications, erp_simulator
from app.services.score_updater import setup_listeners
from app.tasks.scheduler import start_scheduler

app = FastAPI(title="EcoSphere API")
setup_listeners()
start_scheduler()

# Configure CORS for local frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(scores.router)
app.include_router(gamification.router)
app.include_router(copilot.router)
app.include_router(environmental.router)
app.include_router(social.router)
app.include_router(reports.router)
app.include_router(governance.router)
app.include_router(notifications.router)
app.include_router(erp_simulator.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
