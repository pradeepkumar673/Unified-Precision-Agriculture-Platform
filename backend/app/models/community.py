"""SQLAlchemy 2.0 models for the community feature-group.

Covers MASTER-SPEC features #5 (Smart Alerts), #10 (Season Report),
#34 (Digital Sakhi / Support), #35 (SHG Bookings), #36 (Grower Score),
and #53 (FPO Suite).
"""
import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class AlertType(str, enum.Enum):
    weather = "weather"
    irrigation = "irrigation"
    pest = "pest"
    spray_window = "spray_window"


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


# --------------------------------------------------------------------------- #
# alerts (#5 Smart Alerts)
# --------------------------------------------------------------------------- #
class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[AlertType] = mapped_column(
        SAEnum(AlertType, name="alert_type"), nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# season_reports (#10 Season Report)
# --------------------------------------------------------------------------- #
class SeasonReport(Base):
    __tablename__ = "season_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    season: Mapped[str] = mapped_column(String(50), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    investment: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    income: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    profit: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    roi_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    suggestions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# support_tickets (#34 Digital Sakhi)
# --------------------------------------------------------------------------- #
class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    issue: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        SAEnum(TicketStatus, name="ticket_status"),
        default=TicketStatus.open,
        nullable=False,
    )
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
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
# shg_groups & shg_bookings (#35 SHG Bookings)
# --------------------------------------------------------------------------- #
class SHGGroup(Base):
    __tablename__ = "shg_groups"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    member_farm_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SHGBooking(Base):
    __tablename__ = "shg_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    shg_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("shg_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    equipment_booking_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("equipment_bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    split_amounts: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# grower_scores (#36 Grower Score)
# --------------------------------------------------------------------------- #
class GrowerScore(Base):
    __tablename__ = "grower_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    district_percentile: Mapped[int] = mapped_column(Integer, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# fpo_groups (#53 FPO Suite)
# --------------------------------------------------------------------------- #
class FPOGroup(Base):
    __tablename__ = "fpo_groups"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    member_farm_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    pooled_purchases: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    pooled_sales: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    scheme_compliance: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
