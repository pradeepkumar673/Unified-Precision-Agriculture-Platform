"""Pydantic v2 schemas mirroring app.models.finance."""
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.finance import (
    ClaimStatus,
    LoanStatus,
    TransactionStatus,
    TransactionType,
)


# --------------------------------------------------------------------------- #
# Transactions & Payment (#46 Payment Gateway, #47 Transaction Ledger)
# --------------------------------------------------------------------------- #
class PaymentInitiateRequest(BaseModel):
    related_entity_id: str
    amount: float
    type: TransactionType = TransactionType.marketplace


class PaymentInitiateResponse(BaseModel):
    razorpay_order_id: str
    checkout_url: str
    transaction_id: UUID
    amount: float
    status: str


class PaymentWebhookRequest(BaseModel):
    event: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class TransactionRead(BaseModel):
    id: UUID
    user_id: UUID
    type: TransactionType
    amount: float
    status: TransactionStatus
    related_entity_id: str
    tag: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Warehouse (#49 Cold Storage + Receipt Financing)
# --------------------------------------------------------------------------- #
class WarehouseBookingCreate(BaseModel):
    farm_id: UUID
    facility_id: str
    qty_kg: float
    quality_grade: str = "FAQ"


class WarehouseBookingRead(BaseModel):
    id: UUID
    farm_id: UUID
    facility_id: str
    qty_kg: float
    quality_grade: str
    e_nwr_id: Optional[str] = None
    loan_eligible: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ENWRGenerateResponse(WarehouseBookingRead):
    is_mock: bool = True


# --------------------------------------------------------------------------- #
# Loans (#50 Credit Marketplace)
# --------------------------------------------------------------------------- #
class LoanApplyRequest(BaseModel):
    farm_id: UUID
    amount: float


class LoanFactor(BaseModel):
    factor: str
    impact: int


class LoanApplyResponse(BaseModel):
    id: UUID
    farm_id: UUID
    amount: float
    credit_score: int
    approved: bool
    status: LoanStatus
    top_factors: Optional[List[Dict[str, Any]]] = None
    terms: Optional[Dict[str, Any]] = None


class LoanRead(BaseModel):
    id: UUID
    farm_id: UUID
    amount: float
    credit_score: int
    status: LoanStatus
    lender: str
    top_factors: Optional[List[Dict[str, Any]]] = None
    terms: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Insurance Claims (#54 Insurance Claims)
# --------------------------------------------------------------------------- #
class InsuranceClaimCreate(BaseModel):
    farm_id: UUID
    policy_id: str
    loss_event_date: date
    photo_paths: List[str] = Field(default_factory=list)


class InsuranceClaimRead(BaseModel):
    id: UUID
    farm_id: UUID
    policy_id: str
    loss_event_date: date
    evidence: Dict[str, Any]
    status: ClaimStatus
    settlement_amount: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Fraud Check (#28 Anomaly Detection)
# --------------------------------------------------------------------------- #
class FraudCheckRequest(BaseModel):
    transaction_id: UUID


class FraudCheckResponse(BaseModel):
    transaction_id: UUID
    anomaly_score: float
    flagged: bool
