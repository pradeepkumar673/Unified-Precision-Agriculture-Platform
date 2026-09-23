"""API router for gov_compliance endpoints.

Covers MASTER-SPEC features #8 (Gov Scheme Matching v1),
#42 (Auto Eligibility Engine v2), and #43 (Document Vault / OCR).

Routes:
  GET  /api/v1/gov/schemes/match/{farm_id}           → Scheme eligibility evaluation
  POST /api/v1/gov/documents/upload                   → Multipart upload + OCR
  POST /api/v1/gov/documents/{doc_id}/autofill/{scheme_id} → Form autofill
"""
import os
import uuid
from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.farm import Farm
from app.models.gov_compliance import Document, DocType, EligibilityMatch, Scheme
from app.schemas.gov_compliance import (
    AutofillResponse,
    DocumentUploadResponse,
    SchemeMatchResponse,
    SchemeRead,
)
from app.services.gov_compliance import (
    build_autofill_fields,
    match_schemes_for_farm,
    process_document_upload,
)

router = APIRouter(prefix="/api/v1/gov", tags=["gov_compliance"])


# ---------------------------------------------------------------------------
# #8 Gov Scheme Matching / #42 Auto Eligibility Engine
# ---------------------------------------------------------------------------
@router.get("/schemes/match/{farm_id}", response_model=SchemeMatchResponse)
def match_schemes(
    farm_id: UUID,
    db: Session = Depends(get_db),
):
    """Seed schemes table (if empty) and evaluate farm eligibility for every scheme."""
    farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    eligible, ineligible = match_schemes_for_farm(db, farm)

    return SchemeMatchResponse(
        farm_id=farm.id,
        eligible_schemes=[
            SchemeRead(
                id=s.id,
                name=s.name,
                criteria=s.criteria,
                benefit_amount=s.benefit_amount,
                deadline=s.deadline,
                level=s.level,
                created_at=s.created_at,
            )
            for s in eligible
        ],
        ineligible_scheme_ids=[s.id for s in ineligible],
        computed_at=datetime.now(timezone.utc),
    )


# ---------------------------------------------------------------------------
# #43 Document Vault / OCR
# ---------------------------------------------------------------------------
@router.post(
    "/documents/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    farm_id: UUID = Form(...),
    doc_type: DocType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a government document and extract fields via pytesseract OCR."""
    farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    file_content = await file.read()
    filename = file.filename or f"{doc_type.value}_{uuid.uuid4().hex[:8]}.jpg"

    file_path, ocr_extracted = process_document_upload(
        db, farm_id, doc_type, file_content, filename
    )

    doc = Document(
        farm_id=farm_id,
        doc_type=doc_type,
        file_path=file_path,
        ocr_extracted=ocr_extracted,
        verified=False,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentUploadResponse(
        document_id=doc.id,
        ocr_extracted=doc.ocr_extracted,
        doc_type=doc.doc_type,
        farm_id=doc.farm_id,
        file_path=doc.file_path,
        verified=doc.verified,
        created_at=doc.created_at,
    )


@router.post("/documents/{doc_id}/autofill/{scheme_id}", response_model=AutofillResponse)
def autofill_form(
    doc_id: UUID,
    scheme_id: UUID,
    db: Session = Depends(get_db),
):
    """Return a dict of form field values auto-filled from OCR data + farm profile."""
    doc = db.execute(select(Document).where(Document.id == doc_id)).scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    scheme = db.execute(select(Scheme).where(Scheme.id == scheme_id)).scalars().first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    farm = db.execute(select(Farm).where(Farm.id == doc.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    autofilled = build_autofill_fields(farm, doc.ocr_extracted, scheme)

    return AutofillResponse(
        document_id=doc.id,
        scheme_id=scheme.id,
        autofilled_fields=autofilled,
    )

@router.get("/documents/{farm_id}", response_model=List[DocumentUploadResponse])
def get_documents(
    farm_id: UUID,
    db: Session = Depends(get_db),
):
    """Return a list of uploaded documents for a farm."""
    farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
    if not farm:
        # Fallback to first farm if dummy ID used
        farm = db.execute(select(Farm)).scalars().first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")

    docs = db.execute(select(Document).where(Document.farm_id == farm.id).order_by(Document.created_at.desc())).scalars().all()
    
    return [
        DocumentUploadResponse(
            document_id=doc.id,
            ocr_extracted=doc.ocr_extracted,
            doc_type=doc.doc_type,
            farm_id=doc.farm_id,
            file_path=doc.file_path,
            verified=doc.verified,
            created_at=doc.created_at,
        )
        for doc in docs
    ]
