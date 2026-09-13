"""Pydantic v2 schemas mirroring app.models.marketplace."""
from datetime import date, datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.marketplace import BuyerType, OrderStatus, ProductCategory


# --------------------------------------------------------------------------- #
# Products (#6 Inputs Marketplace, #44 AI Input Ranking)
# --------------------------------------------------------------------------- #
class ProductBase(BaseModel):
    name: str
    category: ProductCategory
    price: float
    vendor_id: str
    stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: UUID
    created_at: datetime
    rank_score: Optional[float] = None
    predicted_yield_impact_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Orders (#6 Inputs Marketplace, #45 Delivery Tracking)
# --------------------------------------------------------------------------- #
class OrderCreate(BaseModel):
    farm_id: UUID
    product_id: UUID
    qty: int


class OrderRead(BaseModel):
    id: UUID
    farm_id: UUID
    product_id: UUID
    qty: int
    status: OrderStatus
    delivery_eta: datetime
    critical_window_end: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeliveryStatusResponse(OrderRead):
    delayed: bool


# --------------------------------------------------------------------------- #
# Equipment (#7 Machinery Rental, #24 Dynamic Routing)
# --------------------------------------------------------------------------- #
class EquipmentListingBase(BaseModel):
    owner_id: str
    equipment_type: str
    latitude: float
    longitude: float
    daily_rate: float
    available: bool = True


class EquipmentListingCreate(EquipmentListingBase):
    pass


class EquipmentListingRead(EquipmentListingBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EquipmentBookingCreate(BaseModel):
    listing_id: UUID
    farm_id: UUID
    start_date: date
    end_date: date


class EquipmentBookingRead(BaseModel):
    id: UUID
    listing_id: UUID
    farm_id: UUID
    start_date: date
    end_date: date
    status: str
    assigned_route_eta: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Labor (#52 Labor Marketplace)
# --------------------------------------------------------------------------- #
class LaborListingBase(BaseModel):
    gang_id: str
    skill: str
    daily_wage: float
    latitude: float
    longitude: float
    availability_calendar: dict = Field(default_factory=dict)


class LaborListingCreate(LaborListingBase):
    pass


class LaborListingRead(LaborListingBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LaborBookingCreate(BaseModel):
    listing_id: UUID
    farm_id: UUID
    task_type: str
    date: date


class LaborBookingRead(BaseModel):
    id: UUID
    listing_id: UUID
    farm_id: UUID
    task_type: str
    date: date
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Buyer Requirements & Exchange Match (#9 Harvest & Market, #26 Matching)
# --------------------------------------------------------------------------- #
class BuyerRequirementBase(BaseModel):
    buyer_id: str
    crop: str
    qty_needed_kg: float
    quality_grade: str
    price_offered: float


class BuyerRequirementCreate(BuyerRequirementBase):
    pass


class BuyerRequirementRead(BuyerRequirementBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExchangeMatchRequest(BaseModel):
    buyer_requirement_id: UUID


class ExchangeMatchRead(BaseModel):
    id: UUID
    buyer_requirement_id: UUID
    farm_ids: List[str]
    aggregated_qty_kg: float
    match_score: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# B2B Standing Orders (#55 B2B Channel)
# --------------------------------------------------------------------------- #
class B2BStandingOrderBase(BaseModel):
    buyer_id: str
    buyer_type: BuyerType
    crop: str
    recurring_qty_kg: float


class B2BStandingOrderCreate(B2BStandingOrderBase):
    pass


class B2BStandingOrderRead(B2BStandingOrderBase):
    id: UUID
    fulfilment_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
