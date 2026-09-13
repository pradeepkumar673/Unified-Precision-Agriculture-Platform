from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
from app.core.db import Base, engine

app = FastAPI(
    title="Unified Precision Agriculture Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dev convenience so uvicorn boots straight into a working DB.
Base.metadata.create_all(bind=engine)

app.include_router(farm_router)
app.include_router(planning_router)
app.include_router(health_router)
app.include_router(water_soil_router)
app.include_router(vision_forecast_router)
app.include_router(marketplace_router)
app.include_router(finance_router)
app.include_router(gov_compliance_router)
app.include_router(community_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
