"""Business logic for the gov_compliance feature-group.

Covers MASTER-SPEC features #8 (Gov Matching v1),
#42 (Auto Eligibility Engine v2), and #43 (Document Vault / OCR).
"""
import os
import shutil
import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.farm import AnnualIncomeRange, Farm
from app.models.gov_compliance import DocType, EligibilityMatch, Scheme, SchemeLevel

# ---------------------------------------------------------------------------
# Real government scheme seed data with documented eligibility criteria
# Sources: PM-KISAN, PMFBY, KCC, PM-KUSUM official portal FAQs / guidelines
# ---------------------------------------------------------------------------
SEED_SCHEMES: List[Dict[str, Any]] = [
    {
        "name": "PM-KISAN",
        "level": SchemeLevel.central,
        "benefit_amount": 6000.0,
        "deadline": date(2026, 12, 31),
        "criteria": {
            "description": "Pradhan Mantri Kisan Samman Nidhi — Rs 6000/year in 3 instalments",
            "max_land_acres": 5.0,         # No upper cap in current rules but small-marginal focus
            "min_land_acres": 0.0,
            "excluded_income_ranges": [],  # All income ranges eligible
            "excluded_categories": ["gov_employee", "income_tax_payer"],
            "crop_types": [],              # All crops
            "states": [],                  # All states
        },
    },
    {
        "name": "PMFBY",
        "level": SchemeLevel.central,
        "benefit_amount": 15000.0,
        "deadline": date(2026, 7, 31),
        "criteria": {
            "description": "Pradhan Mantri Fasal Bima Yojana — crop insurance premium at 2% for kharif, 1.5% for rabi",
            "max_land_acres": 0.0,         # 0 = no upper cap
            "min_land_acres": 0.1,
            "crop_types": ["rice", "wheat", "maize", "cotton", "groundnut", "sugarcane", "soybean"],
            "states": [],
            "notified_crops_only": True,
        },
    },
    {
        "name": "KCC",
        "level": SchemeLevel.central,
        "benefit_amount": 300000.0,
        "deadline": None,
        "criteria": {
            "description": "Kisan Credit Card — revolving credit up to Rs 3 lakh at 7% p.a. (4% with prompt repayment)",
            "max_land_acres": 0.0,
            "min_land_acres": 0.1,
            "crop_types": [],
            "states": [],
            "min_credit_score": 0,
        },
    },
    {
        "name": "PM-KUSUM",
        "level": SchemeLevel.central,
        "benefit_amount": 90000.0,
        "deadline": date(2026, 3, 31),
        "criteria": {
            "description": "PM-KUSUM Component-B — 60% subsidy on solar pump up to 7.5 HP for individual farmers",
            "max_land_acres": 0.0,
            "min_land_acres": 0.5,
            "water_sources": ["borewell", "canal", "pond"],
            "crop_types": [],
            "states": [],
        },
    },
    {
        "name": "TN Uzhavar Padhukappu Thittam",
        "level": SchemeLevel.state,
        "benefit_amount": 5000.0,
        "deadline": date(2026, 10, 31),
        "criteria": {
            "description": "Tamil Nadu state farmer protection scheme — compensation for crop loss due to drought/flood",
            "max_land_acres": 12.5,
            "min_land_acres": 0.0,
            "states": ["Tamil Nadu", "TN"],
            "crop_types": ["rice", "sugarcane", "groundnut", "banana", "coconut"],
            "annual_income_ranges": ["under_1L", "1L_5L"],
        },
    },
    {
        "name": "Karnataka RytaBandhu",
        "level": SchemeLevel.state,
        "benefit_amount": 5000.0,
        "deadline": date(2026, 12, 31),
        "criteria": {
            "description": "Karnataka farmer investment support — Rs 5000/season/hectare",
            "max_land_acres": 12.35,      # 5 hectares = 12.35 acres
            "min_land_acres": 0.25,
            "states": ["Karnataka", "KA"],
            "crop_types": [],
            "annual_income_ranges": ["under_1L", "1L_5L", "5L_10L"],
        },
    },
]


# ---------------------------------------------------------------------------
# Income range helpers
# ---------------------------------------------------------------------------
_INCOME_ORDER = ["under_1L", "1L_5L", "5L_10L", "above_10L"]


def _income_rank(income_range: str) -> int:
    try:
        return _INCOME_ORDER.index(str(income_range))
    except ValueError:
        return 0


# ---------------------------------------------------------------------------
# Scheme seeding
# ---------------------------------------------------------------------------
def seed_schemes_if_empty(db: Session) -> None:
    """Insert real government scheme data if the schemes table is empty."""
    count = db.execute(select(Scheme)).scalars().first()
    if count is not None:
        legacy_name = db.execute(
            select(Scheme).where(Scheme.name == "PM-KISAN Samman Nidhi")
        ).scalars().first()
        if legacy_name is not None:
            legacy_name.name = "PM-KISAN"
            db.commit()
        return  # Already seeded

    for s in SEED_SCHEMES:
        scheme = Scheme(
            name=s["name"],
            criteria=s["criteria"],
            benefit_amount=s["benefit_amount"],
            deadline=s["deadline"],
            level=s["level"],
        )
        db.add(scheme)
    db.commit()


# ---------------------------------------------------------------------------
# #42 Auto Eligibility Engine
# ---------------------------------------------------------------------------
def evaluate_farm_eligibility(farm: Farm, scheme: Scheme) -> bool:
    """Evaluate whether a farm profile qualifies for a given scheme.

    Logic mirrors the real eligibility rules in SEED_SCHEMES above.
    """
    criteria = scheme.criteria

    # 1. Land size check
    min_land = criteria.get("min_land_acres", 0.0)
    max_land = criteria.get("max_land_acres", 0.0)
    if min_land > 0 and farm.land_size_acres < min_land:
        return False
    if max_land > 0 and farm.land_size_acres > max_land:
        return False

    # 2. State check
    allowed_states: List[str] = criteria.get("states", [])
    if allowed_states:
        # Use lat/lng as a proxy for Tamil Nadu (8-13°N, 76-80°E) or Karnataka (11-18°N, 74-78°E)
        lat, lon = farm.latitude, farm.longitude
        in_tn = (8.0 <= lat <= 13.5 and 76.0 <= lon <= 80.5)
        in_ka = (11.0 <= lat <= 18.5 and 74.0 <= lon <= 78.5)
        state_match = False
        for s in allowed_states:
            if s in ("Tamil Nadu", "TN") and in_tn:
                state_match = True
            if s in ("Karnataka", "KA") and in_ka:
                state_match = True
        if not state_match:
            return False

    # 3. Annual income filter
    allowed_income_ranges: List[str] = criteria.get("annual_income_ranges", [])
    if allowed_income_ranges:
        farm_income_val = (
            farm.annual_income_range.value
            if hasattr(farm.annual_income_range, "value")
            else str(farm.annual_income_range)
        )
        if farm_income_val not in allowed_income_ranges:
            return False

    # 4. Crop type filter
    allowed_crops: List[str] = criteria.get("crop_types", [])
    if allowed_crops:
        farm_crops_lower = [
            (ch.get("crop", "") if isinstance(ch, dict) else str(ch)).lower()
            for ch in (farm.crop_history or [])
        ]
        crop_match = any(
            ac.lower() in farm_crops_lower for ac in allowed_crops
        )
        if not crop_match:
            return False

    # 5. Water source filter (PM-KUSUM)
    allowed_water: List[str] = criteria.get("water_sources", [])
    if allowed_water:
        farm_water = (
            farm.water_source.value
            if hasattr(farm.water_source, "value")
            else str(farm.water_source)
        )
        if farm_water not in allowed_water:
            return False

    return True


def match_schemes_for_farm(
    db: Session, farm: Farm
) -> Tuple[List[Scheme], List[Scheme]]:
    """Return (eligible_schemes, ineligible_schemes) for the given farm."""
    seed_schemes_if_empty(db)

    all_schemes = db.execute(select(Scheme)).scalars().all()
    eligible, ineligible = [], []

    for scheme in all_schemes:
        is_eligible = evaluate_farm_eligibility(farm, scheme)

        # Upsert eligibility_match record
        existing = db.execute(
            select(EligibilityMatch).where(
                EligibilityMatch.farm_id == farm.id,
                EligibilityMatch.scheme_id == scheme.id,
            )
        ).scalars().first()

        if existing:
            existing.eligible = is_eligible
            existing.computed_at = datetime.now(timezone.utc)
        else:
            match = EligibilityMatch(
                farm_id=farm.id,
                scheme_id=scheme.id,
                eligible=is_eligible,
            )
            db.add(match)

        if is_eligible:
            eligible.append(scheme)
        else:
            ineligible.append(scheme)

    db.commit()
    return eligible, ineligible


# ---------------------------------------------------------------------------
# #43 Document Vault / OCR
# ---------------------------------------------------------------------------
def process_document_upload(
    db: Session,
    farm_id: uuid.UUID,
    doc_type: DocType,
    file_content: bytes,
    filename: str,
) -> Tuple[str, Dict[str, Any]]:
    """Save upload and run pytesseract OCR. Returns (file_path, ocr_extracted)."""
    upload_dir = os.path.join("backend", "media", "documents", str(farm_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    ocr_extracted: Dict[str, Any] = {}
    try:
        import pytesseract
        from PIL import Image
        import io

        _tess = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(_tess):
            pytesseract.pytesseract.tesseract_cmd = _tess

        raw_text = ""
        if filename.lower().endswith(".pdf"):
            import fitz
            pdf_doc = fitz.open(stream=file_content, filetype="pdf")
            for page in pdf_doc:
                raw_text += page.get_text()
            
            # If no text could be extracted directly (e.g. scanned PDF), fallback to OCR
            if not raw_text.strip():
                pix = pdf_doc[0].get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                raw_text = pytesseract.image_to_string(img)
        else:
            img = Image.open(io.BytesIO(file_content))
            raw_text = pytesseract.image_to_string(img)

        lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]

        # Structured extraction based on doc_type
        if doc_type == DocType.aadhaar:
            ocr_extracted = {
                "raw_text": raw_text,
                "name": _extract_between(raw_text, "Name:", "\n"),
                "dob": _extract_between(raw_text, "DOB:", "\n"),
                "gender": "Male" if "MALE" in raw_text.upper() else ("Female" if "FEMALE" in raw_text.upper() else ""),
                "aadhaar_number": _extract_12digit(raw_text),
                "address": " ".join(lines[-4:]) if len(lines) >= 4 else raw_text,
            }
        elif doc_type == DocType.land_record:
            ocr_extracted = {
                "raw_text": raw_text,
                "survey_number": _extract_between(raw_text, "Survey No", "\n"),
                "area": _extract_between(raw_text, "Area", "\n"),
                "owner_name": _extract_between(raw_text, "Owner", "\n"),
                "taluk": _extract_between(raw_text, "Taluk", "\n"),
                "district": _extract_between(raw_text, "District", "\n"),
            }
        elif doc_type == DocType.bank_passbook:
            ocr_extracted = {
                "raw_text": raw_text,
                "account_holder": _extract_between(raw_text, "Name:", "\n"),
                "account_number": _extract_between(raw_text, "A/c No", "\n"),
                "ifsc": _extract_between(raw_text, "IFSC", "\n"),
                "bank_name": lines[0] if lines else "",
                "branch": _extract_between(raw_text, "Branch", "\n"),
            }
        elif doc_type == DocType.insurance:
            ocr_extracted = {
                "raw_text": raw_text,
                "policy_number": _extract_between(raw_text, "Policy No", "\n"),
                "insured_name": _extract_between(raw_text, "Insured", "\n"),
                "sum_insured": _extract_between(raw_text, "Sum Insured", "\n"),
                "valid_upto": _extract_between(raw_text, "Valid Upto", "\n"),
            }
        else:
            ocr_extracted = {"raw_text": raw_text, "lines": lines}

    except Exception as exc:
        # OCR failed gracefully — record error and continue
        ocr_extracted = {
            "ocr_error": str(exc),
            "raw_text": "",
            "note": "pytesseract not configured or image format unsupported; install Tesseract-OCR to enable full OCR.",
        }

    return file_path, ocr_extracted


def _extract_between(text: str, start_key: str, end_key: str) -> str:
    """Extract substring after start_key up to end_key."""
    try:
        idx = text.upper().index(start_key.upper())
        sub = text[idx + len(start_key):].strip()
        end_idx = sub.find(end_key)
        return sub[:end_idx].strip() if end_idx > 0 else sub[:80].strip()
    except ValueError:
        return ""


def _extract_12digit(text: str) -> str:
    """Extract first 12-digit number from text (Aadhaar number pattern)."""
    import re
    matches = re.findall(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", text)
    return matches[0] if matches else ""


# ---------------------------------------------------------------------------
# #43 Autofill helper
# ---------------------------------------------------------------------------
def build_autofill_fields(
    farm: Farm, ocr_extracted: Dict[str, Any], scheme: Scheme
) -> Dict[str, Any]:
    """Map OCR fields + farm profile to government form fields for a scheme."""
    farm_water = (
        farm.water_source.value
        if hasattr(farm.water_source, "value")
        else str(farm.water_source)
    )
    farm_soil = (
        farm.soil_type.value
        if hasattr(farm.soil_type, "value")
        else str(farm.soil_type)
    )
    farm_income = (
        farm.annual_income_range.value
        if hasattr(farm.annual_income_range, "value")
        else str(farm.annual_income_range)
    )

    # Common fields across all government schemes
    common_fields: Dict[str, Any] = {
        "applicant_name": ocr_extracted.get("name", "") or ocr_extracted.get("account_holder", ""),
        "aadhaar_number": ocr_extracted.get("aadhaar_number", ""),
        "bank_account_number": ocr_extracted.get("account_number", ""),
        "bank_ifsc": ocr_extracted.get("ifsc", ""),
        "land_survey_number": ocr_extracted.get("survey_number", ""),
        "land_area_acres": farm.land_size_acres,
        "farm_latitude": farm.latitude,
        "farm_longitude": farm.longitude,
        "soil_type": farm_soil,
        "water_source": farm_water,
        "annual_income_category": farm_income,
        "farm_id": str(farm.id),
        "scheme_name": scheme.name,
        "benefit_amount_inr": scheme.benefit_amount,
    }

    # Scheme-specific extras
    if "PMFBY" in scheme.name:
        crop_list = [
            (ch.get("crop", "") if isinstance(ch, dict) else str(ch))
            for ch in (farm.crop_history or [])
        ]
        common_fields["notified_crops"] = ", ".join(crop_list[:5])
        common_fields["season"] = "kharif"

    if "KCC" in scheme.name:
        common_fields["kcc_limit_requested"] = min(
            300000.0, farm.land_size_acres * 25000
        )
        common_fields["collateral_land_acres"] = farm.land_size_acres

    if "KUSUM" in scheme.name:
        common_fields["pump_hp_required"] = 5.0
        common_fields["irrigation_type"] = farm_water

    return common_fields
