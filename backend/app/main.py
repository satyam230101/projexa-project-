from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.chat import router as chat_router
from app.api.routes.consultations import router as consultations_router
from app.api.routes.contact import router as contact_router
from app.api.routes.doctors import router as doctors_router
from app.api.routes.health import router as health_router
from app.api.routes.reports import router as reports_router
from app.api.routes.user import router as user_router
from app.core.config import get_settings
from app.db.firebase import get_firestore_client

settings = get_settings()

app = FastAPI(title=settings.app_name)

# CORS middleware configuration
cors_origins = settings.allowed_origins or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(reports_router)
app.include_router(user_router)
app.include_router(doctors_router)
app.include_router(consultations_router)
app.include_router(contact_router)
app.include_router(admin_router)


@app.on_event("startup")
def on_startup() -> None:
    # Force Firebase app and Firestore client initialization at startup.
    get_firestore_client()


@app.get('/')
def root():
    return {'message': 'FastAPI backend is running', 'app_name': settings.app_name}
