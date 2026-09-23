"""SQLAlchemy 2.0 models for the marketplace feature-group.

Covers MASTER-SPEC features #6 (Inputs Marketplace), #7 (Machinery Rental),
#9 (Harvest & Market), #24 (Dynamic Routing), #44 (AI Input Ranking),
#45 (Delivery Tracking), #52 (Labor Marketplace), #55 (B2B Channel),
and #26 (Learned Buyer Matching).
"""
import enum
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ProductCategory(str, enum.Enum):
    seed = "seed"
    fertilizer = "fertilizer"
    pesticide = "pesticide"


class OrderStatus(str, enum.Enum):
    placed = "placed"
    shipped = "shipped"
    delivered = "delivered"
    delayed = "delayed"


class BuyerType(str, enum.Enum):
    retail = "retail"
    horeca = "horeca"
    processor = "processor"


# --------------------------------------------------------------------------- #
# products (#6 Inputs Marketplace, #44 AI Input Ranking)
# --------------------------------------------------------------------------- #
class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[ProductCategory] = mapped_column(
        SAEnum(ProductCategory, name="product_category"), nullable=False
    )
    price: Mapped[float] = mapped_column(Float, nullable=False)
    vendor_id: Mapped[str] = mapped_column(String(255), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# orders (#6 Inputs Marketplace, #45 Delivery Tracking)
# --------------------------------------------------------------------------- #
class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, name="order_status"),
        default=OrderStatus.placed,
        nullable=False,
    )
    delivery_eta: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    critical_window_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# equipment_listings & equipment_bookings (#7 Machinery Rental, #24 Routing)
# --------------------------------------------------------------------------- #
class EquipmentListing(Base):
    __tablename__ = "equipment_listings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[str] = mapped_column(String(255), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    daily_rate: Mapped[float] = mapped_column(Float, nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class EquipmentBooking(Base):
    __tablename__ = "equipment_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("equipment_listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="confirmed", nullable=False
    )
    assigned_route_eta: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# labor_listings & labor_bookings (#52 Labor Marketplace)
# --------------------------------------------------------------------------- #
class LaborListing(Base):
    __tablename__ = "labor_listings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    gang_id: Mapped[str] = mapped_column(String(255), nullable=False)
    skill: Mapped[str] = mapped_column(String(255), nullable=False)
    daily_wage: Mapped[float] = mapped_column(Float, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    availability_calendar: Mapped[dict] = mapped_column(
        JSON, default=dict, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class LaborBooking(Base):
    __tablename__ = "labor_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("labor_listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_type: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="confirmed", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# buyer_requirements & exchange_matches (#9 Harvest & Market, #26 Matching)
# --------------------------------------------------------------------------- #
class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    buyer_id: Mapped[str] = mapped_column(String(255), nullable=False)
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    qty_needed_kg: Mapped[float] = mapped_column(Float, nullable=False)
    quality_grade: Mapped[str] = mapped_column(String(50), nullable=False)
    price_offered: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class ExchangeMatch(Base):
    __tablename__ = "exchange_matches"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    buyer_requirement_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("buyer_requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farm_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    aggregated_qty_kg: Mapped[float] = mapped_column(Float, nullable=False)
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="fulfilled", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# b2b_standing_orders (#55 B2B Channel)
# --------------------------------------------------------------------------- #
class B2BStandingOrder(Base):
    __tablename__ = "b2b_standing_orders"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    buyer_id: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_type: Mapped[BuyerType] = mapped_column(
        SAEnum(BuyerType, name="buyer_type"), nullable=False
    )
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    recurring_qty_kg: Mapped[float] = mapped_column(Float, nullable=False)
    fulfilment_status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# buyer_profiles (#55 B2B Channel)
# --------------------------------------------------------------------------- #
class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_type: Mapped[str] = mapped_column(String(255), nullable=False)
    district: Mapped[str] = mapped_column(String(255), nullable=False)
    markup_pct: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    tag: Mapped[str] = mapped_column(String(255), nullable=True)
    perks: Mapped[str] = mapped_column(String(500), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
