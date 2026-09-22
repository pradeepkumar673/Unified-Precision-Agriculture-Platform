"""Pydantic v2 schemas mirroring app.models.community."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.community import AlertType, TicketStatus


# --------------------------------------------------------------------------- #
# Alerts (#5 Smart Alerts)
# --------------------------------------------------------------------------- #
class AlertRead(BaseModel):
    id: UUID
    farm_id: UUID
    type: AlertType
    message: str
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Season Reports (#10 Season Report)
# --------------------------------------------------------------------------- #
class SeasonReportRead(BaseModel):
    id: UUID
    farm_id: UUID
    season: str
    year: int
    investment: float
    income: float
    profit: float
    roi_pct: float
    suggestions: List[str]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Support Tickets (#34 Digital Sakhi)
# --------------------------------------------------------------------------- #
class SupportTicketCreate(BaseModel):
    farm_id: UUID
    issue: str


class SupportTicketRead(BaseModel):
    id: UUID
    farm_id: UUID
    agent_id: Optional[str] = None
    issue: str
    status: TicketStatus
    notes: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# SHG (#35 SHG Bookings)
# --------------------------------------------------------------------------- #
class SHGGroupCreate(BaseModel):
    name: str
    member_farm_ids: List[str]


class SHGGroupRead(BaseModel):
    id: UUID
    name: str
    member_farm_ids: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SHGBookingCreate(BaseModel):
    equipment_booking_id: UUID
    split_amounts: Dict[str, float]


class SHGBookingRead(BaseModel):
    id: UUID
    shg_id: UUID
    equipment_booking_id: UUID
    split_amounts: Dict[str, float]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Grower Score (#36 Grower Score)
# --------------------------------------------------------------------------- #
class GrowerScoreRead(BaseModel):
    id: UUID
    farm_id: UUID
    score: int
    district_percentile: int
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# FPO (#53 FPO Suite)
# --------------------------------------------------------------------------- #
class FPOMemberRead(BaseModel):
    id: UUID
    fpo_id: UUID
    farm_id: UUID
    member_name: Optional[str] = None
    pooled_quantity: float
    crop_type: Optional[str] = None
    status: str
    tag: Optional[str] = None
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FPOTenderRead(BaseModel):
    id: UUID
    fpo_id: UUID
    title: str
    crop_name: str
    target_pooled: float
    current_pooled: float
    target_price: float
    buyer_name: Optional[str] = None
    closes_at: Optional[datetime] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FPOGroupDetailedRead(BaseModel):
    id: UUID
    name: str
    registration_no: Optional[str] = None
    hubs: Optional[str] = None
    wallet_balance: float
    members: List[FPOMemberRead] = Field(default_factory=list)
    tenders: List[FPOTenderRead] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JoinTenderRequest(BaseModel):
    farm_id: UUID
    quantity_qtl: float
