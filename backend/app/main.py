from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import init_db
from app.routers import auth, assessment, workout, nutrition, coach, progress, calendar

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ArogyaMitra API...")
    await init_db()
    logger.info("Database tables initialized.")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="ArogyaMitra API",
    description="AI-powered health & wellness platform – AROMI AI Agent",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Routers
app.include_router(auth.router)
app.include_router(assessment.router)
app.include_router(workout.router)
app.include_router(nutrition.router)
app.include_router(coach.router)
app.include_router(progress.router)
app.include_router(calendar.router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "ArogyaMitra API", "version": "1.0.0"}
# trigger reload
# trigger reload 2
# trigger reload 3
# trigger reload 4
