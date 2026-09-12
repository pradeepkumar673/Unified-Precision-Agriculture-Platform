from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 - register models on Base.metadata
from app.api.v1.farm import router as farm_router
from app.api.v1.planning import router as planning_router
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


@app.get("/health")
def health_check():
    return {"status": "ok"}
