"""SQLAlchemy 2.0 models for the finance feature-group.

Covers MASTER-SPEC features #46 (Payment Gateway), #47 (Transaction Ledger),
#49 (Cold Storage + Receipt Financing), #50 (Credit Marketplace),
#54 (Insurance Claims), and #28 (Anomaly Detection).
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


class TransactionType(str, enum.Enum):
    marketplace = "marketplace"
    rental = "rental"
    scheme_dbt = "scheme_dbt"
    exchange_sale = "exchange_sale"
    loan_disbursement = "loan_disbursement"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    escrow_held = "escrow_held"
    released = "released"
    refunded = "refunded"


class LoanStatus(str, enum.Enum):
    applied = "applied"
    approved = "approved"
    disbursed = "disbursed"
    repaid = "repaid"


class ClaimStatus(str, enum.Enum):
    filed = "filed"
    under_review = "under_review"
    approved = "approved"
    settled = "settled"


# --------------------------------------------------------------------------- #
# transactions (#46 Payment Gateway, #47 Transaction Ledger)
# --------------------------------------------------------------------------- #
class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[TransactionType] = mapped_column(
        SAEnum(TransactionType, name="transaction_type"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        SAEnum(TransactionStatus, name="transaction_status"),
        default=TransactionStatus.pending,
        nullable=False,
    )
    related_entity_id: Mapped[str] = mapped_column(String(255), nullable=False)
    tag: Mapped[str] = mapped_column(String(255), default="", nullable=False)
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
# warehouse_bookings (#49 Cold Storage + Receipt Financing)
# --------------------------------------------------------------------------- #
class WarehouseBooking(Base):
    __tablename__ = "warehouse_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    facility_id: Mapped[str] = mapped_column(String(255), nullable=False)
    qty_kg: Mapped[float] = mapped_column(Float, nullable=False)
    quality_grade: Mapped[str] = mapped_column(
        String(50), default="FAQ", nullable=False
    )
    e_nwr_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    loan_eligible: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
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
# loans (#50 Credit Marketplace)
# --------------------------------------------------------------------------- #
class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    credit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[LoanStatus] = mapped_column(
        SAEnum(LoanStatus, name="loan_status"),
        default=LoanStatus.applied,
        nullable=False,
    )
    lender: Mapped[str] = mapped_column(
        String(255), default="AgriFinance Partner Network", nullable=False
    )
    top_factors: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    terms: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
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
# insurance_claims (#54 Insurance Claims)
# --------------------------------------------------------------------------- #
class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    policy_id: Mapped[str] = mapped_column(String(255), nullable=False)
    loss_event_date: Mapped[date] = mapped_column(Date, nullable=False)
    evidence: Mapped[dict] = mapped_column(
        JSON, default=dict, nullable=False
    )
    status: Mapped[ClaimStatus] = mapped_column(
        SAEnum(ClaimStatus, name="claim_status"),
        default=ClaimStatus.filed,
        nullable=False,
    )
    settlement_amount: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
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
# fraud_flags (#28 Anomaly Detection)
# --------------------------------------------------------------------------- #
class FraudFlag(Base):
    __tablename__ = "fraud_flags"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    flagged: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
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
