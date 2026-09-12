"""SQLAlchemy 2.0 models for the farm feature-group.

Covers MASTER-SPEC features #1 (Digital Farm Profile) and #41 (GPS Field Mapping).
Also declares the `users` table since `farms.user_id` FKs into it.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    String,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


# --------------------------------------------------------------------------- #
# users (minimal — auth/JWT lands in a later step)
# --------------------------------------------------------------------------- #
class UserRole(str, enum.Enum):
    farmer = "farmer"
    agent = "agent"
    admin = "admin"
    buyer = "buyer"
    lender = "lender"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"),
        default=UserRole.farmer,
        nullable=False,
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

    farms: Mapped[list["Farm"]] = relationship(
        "Farm", back_populates="user", cascade="all, delete-orphan"
    )


# --------------------------------------------------------------------------- #
# enums used by the farms table
# --------------------------------------------------------------------------- #
class SoilType(str, enum.Enum):
    clay = "clay"
    loam = "loam"
    sandy = "sandy"
    silt = "silt"
    black = "black"
    red = "red"


class WaterSource(str, enum.Enum):
    borewell = "borewell"
    canal = "canal"
    rainfed = "rainfed"
    pond = "pond"


class AnnualIncomeRange(str, enum.Enum):
    under_1L = "under_1L"
    oneL_5L = "1L_5L"
    fiveL_10L = "5L_10L"
    above_10L = "above_10L"


# --------------------------------------------------------------------------- #
# farms
# --------------------------------------------------------------------------- #
class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    land_size_acres: Mapped[float] = mapped_column(Float, nullable=False)
    soil_type: Mapped[SoilType] = mapped_column(
        SAEnum(SoilType, name="soil_type"), nullable=False
    )
    water_source: Mapped[WaterSource] = mapped_column(
        SAEnum(WaterSource, name="water_source"), nullable=False
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    equipment_owned: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    annual_income_range: Mapped[AnnualIncomeRange] = mapped_column(
        SAEnum(AnnualIncomeRange, name="annual_income_range"), nullable=False
    )
    crop_history: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="farms")
    boundaries: Mapped[list["FieldBoundary"]] = relationship(
        "FieldBoundary", back_populates="farm", cascade="all, delete-orphan"
    )


# --------------------------------------------------------------------------- #
# field_boundaries
# --------------------------------------------------------------------------- #
class FieldBoundary(Base):
    __tablename__ = "field_boundaries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    boundary_points: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    zones: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    farm: Mapped["Farm"] = relationship("Farm", back_populates="boundaries")
