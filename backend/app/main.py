import os
import time
import logging
import json
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Setup structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agri_backend")

# In-memory rate limiter store: IP -> list of timestamps
RATE_LIMIT_STORE = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SEC = 60

from app import models  # noqa: F401 - register models on Base.metadata
from app.api.v1.farm import router as farm_router
from app.api.v1.planning import router as planning_router
from app.api.v1.health import router as health_router
from app.api.v1.water_soil import router as water_soil_router
from app.api.v1.vision_forecast import router as vision_forecast_router
from app.api.v1.marketplace import router as marketplace_router
from app.api.v1.finance import router as finance_router
from app.api.v1.gov_compliance import router as gov_compliance_router
from app.api.v1.community import router as community_router
from app.api.v1.advanced_ai import router as advanced_ai_router
from app.api.v1.auth import router as auth_router
from app.api.v1.cea_iot import router as cea_iot_router
from app.core.db import Base, engine

app = FastAPI(
    title="Unified Precision Agriculture Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Read CORS origins from environment, fallback to localhost for dev
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allow_origins = [origin.strip() for origin in allowed_origins_env.split(",")]
else:
    allow_origins = [
        "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", 
        "http://localhost:5175", "http://127.0.0.1:5175", "http://localhost:4173", 
        "http://127.0.0.1:4173"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def rate_limit_auth(request: Request, call_next):
    # Only rate limit the auth endpoints to prevent demo lockout
    if request.url.path.startswith("/api/v1/auth/login") or request.url.path.startswith("/api/v1/auth/verify-otp"):
        client_ip = request.client.host
        current_time = time.time()
        
        # Clean up old timestamps
        RATE_LIMIT_STORE[client_ip] = [
            ts for ts in RATE_LIMIT_STORE[client_ip] 
            if current_time - ts < RATE_LIMIT_WINDOW_SEC
        ]
        
        if len(RATE_LIMIT_STORE[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many login attempts. Please wait a minute."}
            )
            
        RATE_LIMIT_STORE[client_ip].append(current_time)
        
    return await call_next(request)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    logger.error(json.dumps({
        "error": "Unhandled Exception",
        "path": request.url.path,
        "method": request.method,
        "message": error_msg,
        "client": request.client.host
    }))
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )

# Dev convenience so uvicorn boots straight into a working DB.
Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(farm_router)
app.include_router(planning_router)
app.include_router(health_router)
app.include_router(water_soil_router)
app.include_router(vision_forecast_router)
app.include_router(marketplace_router)
app.include_router(finance_router)
app.include_router(gov_compliance_router)
app.include_router(community_router)
app.include_router(advanced_ai_router)
app.include_router(cea_iot_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
