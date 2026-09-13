"""Pydantic v2 schemas mirroring app.models.gov_compliance."""
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.gov_compliance import DocType, SchemeLevel


# --------------------------------------------------------------------------- #
# Schemes (#8 Gov Scheme Matching, #42 Auto Eligibility Engine)
# --------------------------------------------------------------------------- #
class SchemeBase(BaseModel):
    name: str
    criteria: Dict[str, Any]
    benefit_amount: float
    deadline: Optional[date] = None
    level: SchemeLevel


class SchemeCreate(SchemeBase):
    pass


class SchemeRead(SchemeBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EligibilityMatchRead(BaseModel):
    id: UUID
    farm_id: UUID
    scheme_id: UUID
    eligible: bool
    computed_at: datetime
    scheme: Optional[SchemeRead] = None

    model_config = ConfigDict(from_attributes=True)


class SchemeMatchResponse(BaseModel):
    farm_id: UUID
    eligible_schemes: List[SchemeRead]
    ineligible_scheme_ids: List[UUID]
    computed_at: datetime


# --------------------------------------------------------------------------- #
# Documents (#43 Document Vault / OCR)
# --------------------------------------------------------------------------- #
class DocumentUploadResponse(BaseModel):
    document_id: UUID
    ocr_extracted: Dict[str, Any]
    doc_type: DocType
    farm_id: UUID
    file_path: str
    verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentRead(BaseModel):
    id: UUID
    farm_id: UUID
    doc_type: DocType
    file_path: str
    ocr_extracted: Dict[str, Any]
    verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AutofillResponse(BaseModel):
    document_id: UUID
    scheme_id: UUID
    autofilled_fields: Dict[str, Any]
