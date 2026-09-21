"""Farm feature-group router.

Endpoints:
  POST   /api/v1/farm/profile                      -> create farm profile
  GET    /api/v1/farm/profile/{farm_id}            -> read farm profile
  PUT    /api/v1/farm/profile/{farm_id}            -> partial update
  POST   /api/v1/farm/{farm_id}/boundary           -> GPS boundary + k-means zones
  GET    /api/v1/farm/{farm_id}/zones              -> zones from latest boundary
"""
import logging
import math
import uuid
from typing import List

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sklearn.cluster import KMeans
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.farm import (
    Farm,
    FieldBoundary,
    User,
    UserRole,
)
from app.schemas.farm import (
    BoundaryCreate,
    BoundaryResponse,
    FarmCreate,
    FarmRead,
    FarmUpdate,
    Zone,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/farm", tags=["farm"])

_M2_PER_ACRE = 4046.8564224
_EARTH_RADIUS_M = 6_371_000.0


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _get_or_create_demo_user(db: Session) -> User:
    """JWT auth is a later step; for now every farm profile hangs off a single
    demo farmer so the FK on farms.user_id is satisfiable."""
    user = db.scalar(select(User).where(User.email == "demo.farmer@agri.local"))
    if user is None:
        user = User(
            email="demo.farmer@agri.local",
            hashed_password="!",  # placeholder — not a login-capable account
            full_name="Demo Farmer",
            role=UserRole.farmer,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _polygon_area_acres(points: List[dict]) -> float:
    """Shoelace formula on a locally-projected (equirectangular) polygon.

    lat/lng degrees -> metres using a tangent-plane approximation around the
    polygon centroid. Accurate to well under 1% for the field sizes we care
    about (< a few km across), which is plenty for a farm-boundary area.
    """
    if len(points) < 3:
        return 0.0

    lat0 = sum(p["lat"] for p in points) / len(points)
    lng0 = sum(p["lng"] for p in points) / len(points)

    m_per_deg_lat = math.pi * _EARTH_RADIUS_M / 180.0
    m_per_deg_lng = m_per_deg_lat * math.cos(math.radians(lat0))

    xs = [(p["lng"] - lng0) * m_per_deg_lng for p in points]
    ys = [(p["lat"] - lat0) * m_per_deg_lat for p in points]

    n = len(points)
    acc = 0.0
    for i in range(n):
        j = (i + 1) % n
        acc += xs[i] * ys[j] - xs[j] * ys[i]

    area_m2 = abs(acc) / 2.0
    return area_m2 / _M2_PER_ACRE


# --------------------------------------------------------------------------- #
# Farm profile
# --------------------------------------------------------------------------- #
@router.post(
    "/profile",
    response_model=FarmRead,
    status_code=status.HTTP_201_CREATED,
)
def create_farm_profile(payload: FarmCreate, db: Session = Depends(get_db)):
    user = _get_or_create_demo_user(db)

    farm = Farm(
        user_id=user.id,
        name=payload.name,
        land_size_acres=payload.land_size_acres,
        soil_type=payload.soil_type,
        water_source=payload.water_source,
        latitude=payload.latitude,
        longitude=payload.longitude,
        equipment_owned=list(payload.equipment_owned),
        annual_income_range=payload.annual_income_range,
        crop_history=[c.model_dump() for c in payload.crop_history],
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/profile/{farm_id}", response_model=FarmRead)
def get_farm_profile(farm_id: uuid.UUID, db: Session = Depends(get_db)):
    if str(farm_id) == "00000000-0000-0000-0000-000000000000":
        farm = db.execute(select(Farm)).scalars().first()
    else:
        farm = db.get(Farm, farm_id)
        
    if farm is None:
        # Fallback for invalid/cached localStorage farm IDs
        farm = db.execute(select(Farm)).scalars().first()
        if farm is None:
            raise HTTPException(status_code=404, detail="Farm not found")
            
    return farm


@router.put("/profile/{farm_id}", response_model=FarmRead)
def update_farm_profile(
    farm_id: uuid.UUID, payload: FarmUpdate, db: Session = Depends(get_db)
):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    data = payload.model_dump(exclude_unset=True)

    if "crop_history" in data and data["crop_history"] is not None:
        data["crop_history"] = [
            c if isinstance(c, dict) else c.model_dump() for c in data["crop_history"]
        ]

    for key, value in data.items():
        setattr(farm, key, value)

    db.commit()
    db.refresh(farm)
    return farm


# --------------------------------------------------------------------------- #
# Field boundary + zoning
# --------------------------------------------------------------------------- #
@router.post(
    "/{farm_id}/boundary",
    response_model=BoundaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_farm_boundary(
    farm_id: uuid.UUID, payload: BoundaryCreate, db: Session = Depends(get_db)
):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    points = [p.model_dump() for p in payload.gps_points]
    if len(points) < 3:
        raise HTTPException(
            status_code=422, detail="At least 3 GPS points are required"
        )

    # --- shoelace area ------------------------------------------------------
    area_acres = _polygon_area_acres(points)
    logger.info(
        "Computed boundary area for farm %s: %.4f acres (%d points)",
        farm_id,
        area_acres,
        len(points),
    )

    # --- synthetic per-point soil / NDVI scores -----------------------------
    # Real per-point soil + NDVI rasters are not wired up yet (see
    # docs/04-FEATURE-CHECKLIST.md). We generate deterministic, seeded values
    # so the same farm_id always produces the same zones.
    seed = int.from_bytes(farm_id.bytes[:4], "big")
    rng = np.random.default_rng(seed)

    n = len(points)
    soil_scores = rng.uniform(30.0, 95.0, size=n)      # 0-100 scale
    ndvi_scores = rng.uniform(0.10, 0.90, size=n)      # -1..1, realistic range

    X = np.column_stack([soil_scores, ndvi_scores])

    # 3-5 zones, never more clusters than points
    k = max(3, min(5, n // 2))
    k = min(k, n)

    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = km.fit_predict(X)

    zones = []
    for cluster_id in range(k):
        idx = [i for i, lbl in enumerate(labels) if lbl == cluster_id]
        if not idx:
            continue
        zones.append(
            {
                "zone_id": cluster_id + 1,
                "polygon_points": [points[i] for i in idx],
                "soil_score": round(float(np.mean(soil_scores[idx])), 2),
                "ndvi_score": round(float(np.mean(ndvi_scores[idx])), 4),
            }
        )

    boundary = FieldBoundary(
        farm_id=farm.id,
        boundary_points=points,
        zones=zones,
    )
    db.add(boundary)
    db.commit()
    db.refresh(boundary)

    return {"boundary_points": boundary.boundary_points, "zones": boundary.zones}


@router.get("/{farm_id}/zones", response_model=List[Zone])
def get_farm_zones(farm_id: uuid.UUID, db: Session = Depends(get_db)):
    if str(farm_id) == "00000000-0000-0000-0000-000000000000":
        farm = db.execute(select(Farm)).scalars().first()
    else:
        farm = db.get(Farm, farm_id)
        
    if farm is None:
        # Fallback for invalid/cached localStorage farm IDs
        farm = db.execute(select(Farm)).scalars().first()
        if farm is None:
            raise HTTPException(status_code=404, detail="Farm not found")
            
    farm_id = farm.id

    boundary = db.scalar(
        select(FieldBoundary)
        .where(FieldBoundary.farm_id == farm_id)
        .order_by(FieldBoundary.created_at.desc())
        .limit(1)
    )
    if boundary is None:
        raise HTTPException(
            status_code=404, detail="No boundary recorded for this farm"
        )
    return boundary.zones
