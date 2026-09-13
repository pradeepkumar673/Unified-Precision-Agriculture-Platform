"""SQLAlchemy 2.0 models for the gov_compliance feature-group.

Covers MASTER-SPEC features #8 (Gov Scheme Matching v1),
#42 (Auto Eligibility Engine v2), and #43 (Document Vault / OCR).
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
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class SchemeLevel(str, enum.Enum):
    central = "central"
    state = "state"


class DocType(str, enum.Enum):
    aadhaar = "aadhaar"
    land_record = "land_record"
    bank_passbook = "bank_passbook"
    insurance = "insurance"


# --------------------------------------------------------------------------- #
# schemes (#8 Gov Scheme Matching, #42 Auto Eligibility Engine)
# --------------------------------------------------------------------------- #
class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    criteria: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    benefit_amount: Mapped[float] = mapped_column(Float, nullable=False)
    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    level: Mapped[SchemeLevel] = mapped_column(
        SAEnum(SchemeLevel, name="scheme_level"), nullable=False
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
# eligibility_matches (#42 Auto Eligibility Engine)
# --------------------------------------------------------------------------- #
class EligibilityMatch(Base):
    __tablename__ = "eligibility_matches"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scheme_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("schemes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    eligible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# documents (#43 Document Vault / OCR)
# --------------------------------------------------------------------------- #
class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    doc_type: Mapped[DocType] = mapped_column(
        SAEnum(DocType, name="doc_type"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    ocr_extracted: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
