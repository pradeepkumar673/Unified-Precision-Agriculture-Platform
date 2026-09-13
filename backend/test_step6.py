import os
import uuid
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import SessionLocal
from app.models.farm import Farm, User, UserRole, SoilType, WaterSource, AnnualIncomeRange
from app.models.marketplace import (
    Product, ProductCategory, EquipmentListing, LaborListing, Order, OrderStatus
)
from app.models.planning import CropPlan, SeasonEnum, PlanStatusEnum
from app.models.health import DiseaseReport, DiseaseSeverity
from app.models.vision_forecast import StressAlert, StressLevel
from app.models.finance import Transaction, TransactionType, TransactionStatus, FraudFlag

client = TestClient(app)

def test_all_step6_endpoints():
    db = SessionLocal()

    # 0. Setup test user and farm
    user = User(
        email=f"farmer_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="hashed_pwd",
        full_name="Ramesh Kumar",
        role=UserRole.farmer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = str(user.id)

    farm = Farm(
        user_id=user.id,
        name="Green Valley Farm",
        land_size_acres=3.5,
        soil_type=SoilType.loam,
        water_source=WaterSource.canal,
        latitude=10.7905,
        longitude=78.7047,
        equipment_owned=["tractor"],
        annual_income_range=AnnualIncomeRange.oneL_5L,
        crop_history=[{"season": "kharif", "year": 2025, "crop": "rice"}],
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    farm_id = str(farm.id)

    # Add crop plans for the farm (to test exchange-match and loan scoring)
    cp1 = CropPlan(
        farm_id=farm.id,
        season=SeasonEnum.kharif,
        year=2025,
        recommended_crop="Rice",
        recommended_variety="CO 51",
        sowing_date=date(2025, 6, 15),
        expected_investment=25000.0,
        status=PlanStatusEnum.harvested,
    )
    cp2 = CropPlan(
        farm_id=farm.id,
        season=SeasonEnum.rabi,
        year=2025,
        recommended_crop="Rice",
        recommended_variety="ADT 37",
        sowing_date=date(2025, 11, 15),
        expected_investment=22000.0,
        status=PlanStatusEnum.harvested,
    )
    db.add_all([cp1, cp2])

    # Add sample health & stress data for insurance evidence test
    stress = StressAlert(
        farm_id=farm.id,
        date=date(2026, 9, 1),
        ndvi_value=0.32,
        ndwi_value=-0.12,
        stress_level=StressLevel.moderate,
    )
    disease = DiseaseReport(
        farm_id=farm.id,
        image_path="/uploads/leaf_blast.jpg",
        crop="rice",
        predicted_disease="Rice Blast",
        confidence=0.92,
        severity=DiseaseSeverity.medium,
        treatment_recommendation="Apply Tricyclazole 75% WP @ 0.6g/L",
    )
    db.add_all([stress, disease])

    # Seed products
    p1 = Product(
        name="Hybrid Paddy Seed CR-1009",
        category=ProductCategory.seed,
        price=450.0,
        vendor_id="vendor_seed_corp",
        stock=150,
    )
    p2 = Product(
        name="Organic Bio-NPK Fertilizer",
        category=ProductCategory.fertilizer,
        price=320.0,
        vendor_id="vendor_agribio",
        stock=80,
    )
    p3 = Product(
        name="Neem Extract Bio-Pesticide",
        category=ProductCategory.pesticide,
        price=550.0,
        vendor_id="vendor_ecoprotect",
        stock=50,
    )
    db.add_all([p1, p2, p3])

    # Seed equipment listing
    eq_listing = EquipmentListing(
        owner_id="owner_tractor_hub",
        equipment_type="Combine Harvester",
        latitude=10.8200,
        longitude=78.7200,
        daily_rate=3500.0,
        available=True,
    )
    db.add(eq_listing)

    # Seed labor listing
    lb_listing = LaborListing(
        gang_id="gang_trichy_01",
        skill="Harvesting & Threshing",
        daily_wage=600.0,
        latitude=10.8000,
        longitude=78.7100,
        availability_calendar={"2026-09-25": "available"},
    )
    db.add(lb_listing)
    db.commit()

    db.refresh(p1)
    db.refresh(p2)
    db.refresh(p3)
    db.refresh(eq_listing)
    db.refresh(lb_listing)

    product_id = str(p1.id)
    equipment_listing_id = str(eq_listing.id)
    labor_listing_id = str(lb_listing.id)

    db.close()

    print("\n--- 1. GET /api/v1/marketplace/products ---")
    resp = client.get(f"/api/v1/marketplace/products?farm_id={farm_id}")
    assert resp.status_code == 200, resp.text
    products = resp.json()
    print(f"Products count: {len(products)}")
    assert len(products) >= 3
    for p in products:
        assert "rank_score" in p
        assert "predicted_yield_impact_score" in p
    print("GET /products passed:", products[0])

    print("\n--- 2. POST /api/v1/marketplace/order ---")
    resp = client.post("/api/v1/marketplace/order", json={
        "farm_id": farm_id,
        "product_id": product_id,
        "qty": 5,
    })
    assert resp.status_code == 201, resp.text
    order_data = resp.json()
    order_id = order_data["id"]
    print("Order created:", order_data)
    assert order_data["status"] == "placed"
    assert order_data["qty"] == 5

    # Test out of stock error
    resp = client.post("/api/v1/marketplace/order", json={
        "farm_id": farm_id,
        "product_id": product_id,
        "qty": 99999,
    })
    assert resp.status_code == 409, "Expected 409 for insufficient stock"
    print("Insufficient stock handled:", resp.json())

    print("\n--- 3. POST /api/v1/marketplace/equipment/book ---")
    resp = client.post("/api/v1/marketplace/equipment/book", json={
        "listing_id": equipment_listing_id,
        "farm_id": farm_id,
        "start_date": "2026-09-20",
        "end_date": "2026-09-22",
    })
    assert resp.status_code == 201, resp.text
    eq_booking = resp.json()
    print("Equipment booking:", eq_booking)
    assert eq_booking["status"] == "confirmed"
    assert eq_booking["assigned_route_eta"] is not None

    # Test double booking conflict
    resp = client.post("/api/v1/marketplace/equipment/book", json={
        "listing_id": equipment_listing_id,
        "farm_id": farm_id,
        "start_date": "2026-09-21",
        "end_date": "2026-09-23",
    })
    assert resp.status_code == 409, "Expected 409 for conflicting dates"
    print("Double booking conflict handled:", resp.json())

    print("\n--- 4. POST /api/v1/marketplace/labor/book ---")
    resp = client.post("/api/v1/marketplace/labor/book", json={
        "listing_id": labor_listing_id,
        "farm_id": farm_id,
        "task_type": "harvest",
        "date": "2026-09-25",
    })
    assert resp.status_code == 201, resp.text
    lb_booking = resp.json()
    print("Labor booking:", lb_booking)
    assert lb_booking["status"] == "confirmed"

    # Test labor conflict
    resp = client.post("/api/v1/marketplace/labor/book", json={
        "listing_id": labor_listing_id,
        "farm_id": farm_id,
        "task_type": "harvest",
        "date": "2026-09-25",
    })
    assert resp.status_code == 409, "Expected 409 for duplicate labor booking"
    print("Labor conflict handled:", resp.json())

    print("\n--- 5. POST /api/v1/marketplace/buyer-requirement ---")
    resp = client.post("/api/v1/marketplace/buyer-requirement", json={
        "buyer_id": "buyer-wholesale-agri",
        "crop": "Rice",
        "qty_needed_kg": 800.0,
        "quality_grade": "FAQ",
        "price_offered": 24.5,
    })
    assert resp.status_code == 201, resp.text
    buyer_req = resp.json()
    br_id = buyer_req["id"]
    print("Buyer requirement:", buyer_req)

    print("\n--- 6. POST /api/v1/marketplace/exchange-match ---")
    resp = client.post("/api/v1/marketplace/exchange-match", json={
        "buyer_requirement_id": br_id,
    })
    assert resp.status_code == 201, resp.text
    match_data = resp.json()
    print("Exchange match:", match_data)
    assert len(match_data["farm_ids"]) >= 1
    assert match_data["status"] == "fulfilled"

    print("\n--- 7. GET /api/v1/marketplace/delivery-status/{order_id} ---")
    resp = client.get(f"/api/v1/marketplace/delivery-status/{order_id}")
    assert resp.status_code == 200, resp.text
    del_status = resp.json()
    print("Delivery status:", del_status)
    assert "delayed" in del_status

    print("\n--- 8. POST /api/v1/marketplace/b2b/standing-order ---")
    resp = client.post("/api/v1/marketplace/b2b/standing-order", json={
        "buyer_id": "retail-chain-fresh",
        "buyer_type": "retail",
        "crop": "Rice",
        "recurring_qty_kg": 500.0,
    })
    assert resp.status_code == 201, resp.text
    b2b_so = resp.json()
    print("B2B standing order:", b2b_so)
    assert b2b_so["fulfilment_status"] == "pending"

    print("\n--- 9. POST /api/v1/finance/payment/initiate ---")
    resp = client.post("/api/v1/finance/payment/initiate", json={
        "related_entity_id": user_id,
        "amount": 1250.0,
        "type": "marketplace",
    })
    print(f"Payment initiate status: {resp.status_code}")
    if resp.status_code == 200:
        pay_init = resp.json()
        print("Payment initiate response:", pay_init)
        assert "razorpay_order_id" in pay_init
    else:
        # Expected 502 with clear message when using mock credentials offline
        print("Payment initiate returned clean 502 as expected for mock keys:", resp.json())
        assert resp.status_code == 502
        assert "Could not reach Razorpay" in resp.json()["detail"]

    print("\n--- 10. POST /api/v1/finance/payment/webhook ---")
    # Seed a transaction to test webhook
    db2 = SessionLocal()
    tx1 = Transaction(
        user_id=uuid.UUID(user_id),
        type=TransactionType.marketplace,
        amount=850.0,
        status=TransactionStatus.pending,
        related_entity_id=order_id,
        tag="rzp_order:order_TESTABC123",
    )
    db2.add(tx1)
    db2.commit()
    db2.refresh(tx1)
    t1_id = str(tx1.id)
    db2.close()

    resp = client.post("/api/v1/finance/payment/webhook", json={
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_TESTXYZ",
                    "order_id": "order_TESTABC123",
                    "status": "captured",
                }
            }
        }
    })
    assert resp.status_code == 200, resp.text
    wh_resp = resp.json()
    print("Webhook response:", wh_resp)
    assert wh_resp["new_status"] == "released"

    print("\n--- 11. GET /api/v1/finance/ledger/{farm_id} ---")
    resp = client.get(f"/api/v1/finance/ledger/{user_id}")
    assert resp.status_code == 200, resp.text
    ledger = resp.json()
    print(f"Ledger entries: {len(ledger)}")
    assert len(ledger) >= 1
    print("Ledger entry:", ledger[0])

    print("\n--- 12. GET /api/v1/finance/ledger/{farm_id}/export (PDF) ---")
    resp = client.get(f"/api/v1/finance/ledger/{user_id}/export")
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:4] == b"%PDF", "Response is not a valid PDF header"
    print(f"PDF export generated successfully! Size: {len(resp.content)} bytes, PDF header: {resp.content[:8]}")

    print("\n--- 13. POST /api/v1/finance/warehouse/book ---")
    resp = client.post("/api/v1/finance/warehouse/book", json={
        "farm_id": farm_id,
        "facility_id": "WH-MDU-01",
        "qty_kg": 1000.0,
        "quality_grade": "FAQ",
    })
    assert resp.status_code == 201, resp.text
    wh_booking = resp.json()
    wh_id = wh_booking["id"]
    print("Warehouse booking:", wh_booking)
    assert wh_booking["loan_eligible"] is False

    print("\n--- 14. POST /api/v1/finance/warehouse/{id}/generate-enwr ---")
    resp = client.post(f"/api/v1/finance/warehouse/{wh_id}/generate-enwr")
    assert resp.status_code == 200, resp.text
    enwr_res = resp.json()
    print("e-NWR generated:", enwr_res)
    assert enwr_res["e_nwr_id"].startswith("WDRA-ENWR-")
    assert enwr_res["loan_eligible"] is True
    assert enwr_res["is_mock"] is True

    print("\n--- 15. POST /api/v1/finance/loan/apply ---")
    resp = client.post("/api/v1/finance/loan/apply", json={
        "farm_id": farm_id,
        "amount": 50000.0,
    })
    assert resp.status_code == 201, resp.text
    loan_data = resp.json()
    print("Loan application:", loan_data)
    assert loan_data["credit_score"] >= 650
    assert loan_data["approved"] is True
    assert loan_data["terms"] is not None

    print("\n--- 16. POST /api/v1/finance/insurance/claim + GET claim ---")
    resp = client.post("/api/v1/finance/insurance/claim", json={
        "farm_id": farm_id,
        "policy_id": "POL-PMFBY-2026-99",
        "loss_event_date": "2026-09-01",
        "photo_paths": ["/uploads/damage_crop1.jpg"],
    })
    assert resp.status_code == 201, resp.text
    claim_data = resp.json()
    claim_id = claim_data["id"]
    print("Insurance claim filed:", claim_data)
    assert len(claim_data["evidence"]["stress_alerts"]) >= 1
    assert len(claim_data["evidence"]["disease_reports"]) >= 1

    resp = client.get(f"/api/v1/finance/insurance/claim/{claim_id}")
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == claim_id

    print("\n--- 17. POST /api/v1/finance/fraud-check ---")
    # Add a huge anomalous transaction
    db3 = SessionLocal()
    tx_huge = Transaction(
        user_id=uuid.UUID(user_id),
        type=TransactionType.marketplace,
        amount=500000.0,  # anomaly
        status=TransactionStatus.released,
        related_entity_id="tx-suspicious-01",
        tag="large_bulk_purchase",
    )
    db3.add(tx_huge)
    db3.commit()
    db3.refresh(tx_huge)
    tx_huge_id = str(tx_huge.id)
    db3.close()

    resp = client.post("/api/v1/finance/fraud-check", json={
        "transaction_id": tx_huge_id,
    })
    assert resp.status_code == 200, resp.text
    fraud_res = resp.json()
    print("Fraud check anomaly detection:", fraud_res)
    assert fraud_res["flagged"] is True
    assert fraud_res["anomaly_score"] > 3.0

    print("\n=== ALL 17 STEP 6 TEST SUITES PASSED LIVE! ===")

if __name__ == "__main__":
    test_all_step6_endpoints()
