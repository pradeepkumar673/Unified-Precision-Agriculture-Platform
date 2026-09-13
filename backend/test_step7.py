"""End-to-end test suite for Step 7 — gov_compliance and community endpoints."""
import uuid
from datetime import date
from fastapi.testclient import TestClient

from app.main import app
from app.core.db import SessionLocal
from app.models.farm import Farm, User, UserRole, SoilType, WaterSource, AnnualIncomeRange
from app.models.marketplace import EquipmentListing, EquipmentBooking
from app.models.planning import CropPlan, SeasonEnum, PlanStatusEnum
from app.models.vision_forecast import StressAlert, StressLevel
from app.models.finance import Transaction, TransactionType, TransactionStatus

client = TestClient(app)


def test_all_step7_endpoints():
    db = SessionLocal()

    # -----------------------------------------------------------------------
    # Setup: Tamil Nadu farm (for PM-KISAN / PMFBY / TN scheme eligibility)
    # lat=10.77, lon=78.67 → inside Tamil Nadu bounding box
    # -----------------------------------------------------------------------
    user = User(
        email=f"tn_farmer_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="hashed",
        full_name="Murugan Rajan",
        role=UserRole.farmer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    farm = Farm(
        user_id=user.id,
        name="Kaveri Delta Farm",
        land_size_acres=2.5,
        soil_type=SoilType.loam,
        water_source=WaterSource.canal,
        latitude=10.77,
        longitude=78.67,
        equipment_owned=[],
        annual_income_range=AnnualIncomeRange.oneL_5L,
        crop_history=[
            {"season": "kharif", "year": 2025, "crop": "rice"},
            {"season": "rabi", "year": 2025, "crop": "groundnut"},
        ],
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    farm_id = str(farm.id)

    # Seed crop plan, stress alert, transactions for season-report & grower-score
    cp = CropPlan(
        farm_id=farm.id,
        season=SeasonEnum.kharif,
        year=2026,
        recommended_crop="Rice",
        recommended_variety="CO 51",
        sowing_date=date(2026, 6, 15),
        expected_investment=30000.0,
        status=PlanStatusEnum.harvested,
    )
    db.add(cp)

    stress = StressAlert(
        farm_id=farm.id,
        date=date(2026, 9, 5),
        ndvi_value=0.31,
        ndwi_value=-0.15,
        stress_level=StressLevel.moderate,
    )
    db.add(stress)

    tx1 = Transaction(
        user_id=user.id,
        type=TransactionType.marketplace,
        amount=12000.0,
        status=TransactionStatus.released,
        related_entity_id="seed-purchase-001",
        tag="marketplace_spend",
    )
    tx2 = Transaction(
        user_id=user.id,
        type=TransactionType.exchange_sale,
        amount=48000.0,
        status=TransactionStatus.released,
        related_entity_id="paddy-sale-01",
        tag="exchange_sale_001",
    )
    db.add_all([tx1, tx2])

    # Seed an equipment booking for SHG book test
    eq_listing = EquipmentListing(
        owner_id="owner-shg-equipment",
        equipment_type="Power Tiller",
        latitude=10.78,
        longitude=78.68,
        daily_rate=1200.0,
        available=True,
    )
    db.add(eq_listing)
    db.commit()
    db.refresh(eq_listing)

    eq_booking = EquipmentBooking(
        listing_id=eq_listing.id,
        farm_id=farm.id,
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 3),
        status="confirmed",
    )
    db.add(eq_booking)
    db.commit()
    db.refresh(eq_booking)
    eq_booking_id = str(eq_booking.id)

    db.close()

    # -----------------------------------------------------------------------
    # 1. GET /api/v1/gov/schemes/match/{farm_id}
    # -----------------------------------------------------------------------
    print("\n--- 1. GET /api/v1/gov/schemes/match/{farm_id} ---")
    resp = client.get(f"/api/v1/gov/schemes/match/{farm_id}")
    assert resp.status_code == 200, resp.text
    match_data = resp.json()
    print(f"Total eligible schemes: {len(match_data['eligible_schemes'])}")
    for s in match_data["eligible_schemes"]:
        print(f"  [OK] {s['name']} -- benefit Rs {s['benefit_amount']:,.0f}")
    assert len(match_data["eligible_schemes"]) >= 3, "Expected ≥3 eligible schemes for this TN farm"
    assert any(s["name"] == "PM-KISAN" for s in match_data["eligible_schemes"]), "PM-KISAN must be eligible"

    # -----------------------------------------------------------------------
    # 2. POST /api/v1/gov/documents/upload
    # -----------------------------------------------------------------------
    print("\n--- 2. POST /api/v1/gov/documents/upload ---")
    # Use a minimal JPEG bytes (1×1 white pixel)
    minimal_jpeg = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n'
        b'\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d'
        b'\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\x1e=\xff\xc0\x00'
        b'\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01'
        b'\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02'
        b'\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03'
        b'\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11'
        b'\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1'
        b'\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcde'
        b'fghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97'
        b'\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6'
        b'\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5'
        b'\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2'
        b'\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00'
        b'\xfb\xd4P\x00\x00\x00\x1f\xff\xd9'
    )
    resp = client.post(
        "/api/v1/gov/documents/upload",
        data={"farm_id": farm_id, "doc_type": "aadhaar"},
        files={"file": ("aadhaar_test.jpg", minimal_jpeg, "image/jpeg")},
    )
    assert resp.status_code == 201, resp.text
    doc_data = resp.json()
    doc_id = doc_data["document_id"]
    print("Document uploaded:", doc_id)
    print("OCR extracted keys:", list(doc_data["ocr_extracted"].keys()))
    assert "ocr_extracted" in doc_data

    # -----------------------------------------------------------------------
    # 3. POST /api/v1/gov/documents/{doc_id}/autofill/{scheme_id}
    # -----------------------------------------------------------------------
    # Get a scheme ID from previous match
    scheme_id = match_data["eligible_schemes"][0]["id"]
    print(f"\n--- 3. POST /api/v1/gov/documents/{doc_id}/autofill/{scheme_id} ---")
    resp = client.post(f"/api/v1/gov/documents/{doc_id}/autofill/{scheme_id}")
    assert resp.status_code == 200, resp.text
    autofill = resp.json()
    print("Autofilled fields:", list(autofill["autofilled_fields"].keys()))
    assert "land_area_acres" in autofill["autofilled_fields"]
    assert autofill["autofilled_fields"]["land_area_acres"] == 2.5
    print("land_area_acres:", autofill["autofilled_fields"]["land_area_acres"])
    print("benefit_amount_inr:", autofill["autofilled_fields"]["benefit_amount_inr"])

    # -----------------------------------------------------------------------
    # 4. GET /api/v1/community/alerts/{farm_id}
    # -----------------------------------------------------------------------
    print("\n--- 4. GET /api/v1/community/alerts/{farm_id} ---")
    resp = client.get(f"/api/v1/community/alerts/{farm_id}")
    assert resp.status_code == 200, resp.text
    alerts = resp.json()
    print(f"Alerts generated: {len(alerts)}")
    for a in alerts:
        print(f"  [{a['type']}] {a['message'][:80]}...")
    assert len(alerts) >= 2
    alert_types = {a["type"] for a in alerts}
    assert "irrigation" in alert_types
    assert "pest" in alert_types

    # -----------------------------------------------------------------------
    # 5. GET /api/v1/community/season-report/{farm_id}?season=kharif&year=2026
    # -----------------------------------------------------------------------
    print("\n--- 5. GET /api/v1/community/season-report/{farm_id} ---")
    resp = client.get(f"/api/v1/community/season-report/{farm_id}?season=kharif&year=2026")
    assert resp.status_code == 200, resp.text
    report = resp.json()
    print("Season report:", report)
    assert report["season"] == "kharif"
    assert report["year"] == 2026
    assert report["investment"] > 0
    assert report["income"] > 0
    assert len(report["suggestions"]) >= 1

    # -----------------------------------------------------------------------
    # 6. POST /api/v1/community/support-ticket
    # -----------------------------------------------------------------------
    print("\n--- 6. POST /api/v1/community/support-ticket ---")
    resp = client.post("/api/v1/community/support-ticket", json={
        "farm_id": farm_id,
        "issue": "My irrigation pump stopped working after heavy rain. Need technical help urgently.",
    })
    assert resp.status_code == 201, resp.text
    ticket = resp.json()
    print("Support ticket:", ticket)
    assert ticket["status"] == "open"

    # -----------------------------------------------------------------------
    # 7. POST /api/v1/community/shg/create
    # -----------------------------------------------------------------------
    print("\n--- 7. POST /api/v1/community/shg/create ---")
    farm_id2 = str(uuid.uuid4())  # second farm placeholder
    resp = client.post("/api/v1/community/shg/create", json={
        "name": "Kaveri Women SHG",
        "member_farm_ids": [farm_id, farm_id2],
    })
    assert resp.status_code == 201, resp.text
    shg = resp.json()
    shg_id = shg["id"]
    print("SHG created:", shg)
    assert len(shg["member_farm_ids"]) == 2

    # -----------------------------------------------------------------------
    # 8. POST /api/v1/community/shg/{id}/book
    # -----------------------------------------------------------------------
    print(f"\n--- 8. POST /api/v1/community/shg/{shg_id}/book ---")
    resp = client.post(f"/api/v1/community/shg/{shg_id}/book", json={
        "equipment_booking_id": eq_booking_id,
        "split_amounts": {farm_id: 600.0, farm_id2: 600.0},
    })
    assert resp.status_code == 201, resp.text
    shg_booking = resp.json()
    print("SHG booking:", shg_booking)
    assert shg_booking["shg_id"] == shg_id

    # -----------------------------------------------------------------------
    # 9. GET /api/v1/community/grower-score/{farm_id}
    # -----------------------------------------------------------------------
    print("\n--- 9. GET /api/v1/community/grower-score/{farm_id} ---")
    resp = client.get(f"/api/v1/community/grower-score/{farm_id}")
    assert resp.status_code == 200, resp.text
    gs = resp.json()
    print("Grower score:", gs)
    assert 0 <= gs["score"] <= 1000
    assert 0 <= gs["district_percentile"] <= 100
    print(f"Score: {gs['score']}/1000 | Percentile: {gs['district_percentile']}th")

    # -----------------------------------------------------------------------
    # 10. POST /api/v1/community/fpo/create
    # -----------------------------------------------------------------------
    print("\n--- 10. POST /api/v1/community/fpo/create ---")
    resp = client.post("/api/v1/community/fpo/create", json={
        "name": "Trichy Paddy Producers FPO",
        "member_farm_ids": [farm_id, farm_id2],
    })
    assert resp.status_code == 201, resp.text
    fpo = resp.json()
    fpo_id = fpo["id"]
    print("FPO created:", fpo)
    assert fpo["pooled_purchases"] == []

    # -----------------------------------------------------------------------
    # 11. POST /api/v1/community/fpo/{id}/pool-purchase
    # -----------------------------------------------------------------------
    print(f"\n--- 11. POST /api/v1/community/fpo/{fpo_id}/pool-purchase ---")
    resp = client.post(f"/api/v1/community/fpo/{fpo_id}/pool-purchase", json={
        "item": "Urea Fertilizer",
        "qty_kg": 500.0,
        "amount": 8500.0,
        "vendor": "AgriInputs Ltd",
        "notes": "Bulk discount 12%",
    })
    assert resp.status_code == 200, resp.text
    fpo_updated = resp.json()
    print("FPO after purchase:", fpo_updated["pooled_purchases"])
    assert len(fpo_updated["pooled_purchases"]) == 1
    assert fpo_updated["pooled_purchases"][0]["item"] == "Urea Fertilizer"

    # -----------------------------------------------------------------------
    # 12. POST /api/v1/community/fpo/{id}/pool-sale
    # -----------------------------------------------------------------------
    print(f"\n--- 12. POST /api/v1/community/fpo/{fpo_id}/pool-sale ---")
    resp = client.post(f"/api/v1/community/fpo/{fpo_id}/pool-sale", json={
        "item": "Paddy Grade-A",
        "qty_kg": 8000.0,
        "amount": 176000.0,
        "buyer": "Reliance Fresh Procurement",
        "notes": "MSP+5 negotiated rate",
    })
    assert resp.status_code == 200, resp.text
    fpo_with_sale = resp.json()
    print("FPO after sale:", fpo_with_sale["pooled_sales"])
    assert len(fpo_with_sale["pooled_sales"]) == 1
    assert fpo_with_sale["pooled_sales"][0]["item"] == "Paddy Grade-A"

    print("\n=== ALL 12 STEP 7 TEST SUITES PASSED LIVE! ===")


if __name__ == "__main__":
    test_all_step7_endpoints()
