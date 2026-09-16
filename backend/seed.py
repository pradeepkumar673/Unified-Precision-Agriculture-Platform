"""
Seed script for the Unified Precision Agriculture Platform.
Creates 5 demo farmers, 3 buyers, and populates historical data
so every page has realistic-looking content.

Run with: python seed.py (from backend/ directory with venv active)
"""
import sys
import os
import uuid
import random
from datetime import datetime, timedelta, date

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.db import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models import (
    User, UserRole, Farm, SoilType, WaterSource, AnnualIncomeRange, FieldBoundary,
    CropPlan, SeasonEnum, PlanStatusEnum, RotationPlan, VarietyRecommendation, PrescriptionMap,
    DiseaseReport, DiseaseSeverity, WeedReport, PestRiskScore, Livestock, AnimalType, LivestockHealthReport,
    IrrigationSchedule, SoilHealthMap,
    StressAlert, StressLevel, PlantCount, GrainQualityReport, GrainGrade, PriceForecast, YieldForecast, ClimateRiskScore,
    Product, ProductCategory, Order, OrderStatus, EquipmentListing, EquipmentBooking, LaborListing, LaborBooking,
    BuyerRequirement, ExchangeMatch, B2BStandingOrder, BuyerType,
    Transaction, TransactionType, TransactionStatus, Loan, LoanStatus, WarehouseBooking, InsuranceClaim, ClaimStatus,
    Scheme, SchemeLevel, Document, DocType, EligibilityMatch,
    Alert, AlertType, SeasonReport, GrowerScore, SHGGroup, FPOGroup, SupportTicket, TicketStatus,
    VoiceQuery, MultimodalQuery, CausalSimulation, FLTrainingRun,
)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        demo = db.query(User).filter(User.email == "demo@agri.test").first()
        if demo is None:
            demo = db.query(User).filter(User.email == "ramesh@example.com").first()
            if demo is None:
                demo = db.query(User).filter(User.role == UserRole.farmer).order_by(User.created_at).first()
            if demo is not None:
                demo.email = "demo@agri.test"
        if demo:
            demo.hashed_password = hash_password("demo1234")
            demo.full_name = "Demo Farmer"
            demo.role = UserRole.farmer
            farm = db.query(Farm).filter(Farm.user_id == demo.id).first()
            if farm is None:
                farm = Farm(
                    user_id=demo.id,
                    name="Demo Farm",
                    land_size_acres=4.5,
                    soil_type=SoilType.black,
                    water_source=WaterSource.borewell,
                    latitude=18.52,
                    longitude=73.85,
                    equipment_owned=["tractor", "sprayer"],
                    annual_income_range=AnnualIncomeRange.fiveL_10L,
                    crop_history=[
                        {"season": "kharif", "year": 2025, "crop": "soybean"},
                        {"season": "rabi", "year": 2025, "crop": "wheat"},
                    ],
                )
                db.add(farm)
            db.commit()
            print(f"[OK] Demo login repaired: demo@agri.test / demo1234")
            print(f"[OK] Demo farm UUID: {farm.id}")
            for user in db.query(User).order_by(User.created_at).all():
                print(f"[USER] {user.email} / {'demo1234' if user.email == 'demo@agri.test' else 'farmer1234' if user.role == UserRole.farmer else 'buyer1234'}")
            return

        print("[SEED] Seeding database...")

        # -- Users: 5 farmers + 3 buyers --
        farmers = []
        farmer_data = [
            ("Demo Farmer", "demo@agri.test"),
            ("Suresh Patil", "suresh@example.com"),
            ("Anita Devi", "anita@example.com"),
            ("Manoj Singh", "manoj@example.com"),
            ("Lakshmi Naik", "lakshmi@example.com"),
        ]
        for name, email in farmer_data:
            u = User(id=uuid.uuid4(), email=email, hashed_password=hash_password("demo1234" if email == "demo@agri.test" else "farmer1234"), full_name=name, role=UserRole.farmer)
            db.add(u)
            farmers.append(u)

        buyers = []
        buyer_data = [
            ("ITC Agri Business", "itc@example.com"),
            ("Reliance Fresh", "reliance@example.com"),
            ("BigBasket Procurement", "bigbasket@example.com"),
        ]
        for name, email in buyer_data:
            u = User(id=uuid.uuid4(), email=email, hashed_password=hash_password("buyer1234"), full_name=name, role=UserRole.buyer)
            db.add(u)
            buyers.append(u)

        db.flush()

        # -- Farms --
        farms = []
        farm_configs = [
            ("Ramesh Farm", 4.5, SoilType.black, WaterSource.borewell, 18.52, 73.85, AnnualIncomeRange.fiveL_10L),
            ("Suresh Farm", 2.0, SoilType.loam, WaterSource.canal, 19.07, 72.87, AnnualIncomeRange.oneL_5L),
            ("Anita Farm", 6.0, SoilType.clay, WaterSource.rainfed, 23.25, 77.41, AnnualIncomeRange.above_10L),
            ("Manoj Farm", 3.0, SoilType.sandy, WaterSource.pond, 26.84, 80.94, AnnualIncomeRange.oneL_5L),
            ("Lakshmi Farm", 1.5, SoilType.red, WaterSource.borewell, 15.31, 75.71, AnnualIncomeRange.under_1L),
        ]
        for i, (name, acres, soil, water, lat, lon, income) in enumerate(farm_configs):
            f = Farm(
                id=uuid.uuid4(), user_id=farmers[i].id, name=name,
                land_size_acres=acres, soil_type=soil, water_source=water,
                latitude=lat, longitude=lon,
                equipment_owned=random.sample(["tractor", "sprayer", "rotavator", "thresher", "plough"], k=random.randint(1, 3)),
                annual_income_range=income,
                crop_history=[
                    {"season": "kharif", "year": 2022, "crop": "rice"},
                    {"season": "rabi", "year": 2022, "crop": "wheat"},
                    {"season": "kharif", "year": 2023, "crop": "soybean"},
                ]
            )
            db.add(f)
            farms.append(f)
        db.flush()

        # -- Field Boundaries --
        for f in farms:
            fb = FieldBoundary(
                id=uuid.uuid4(), farm_id=f.id,
                boundary_points=[
                    {"lat": f.latitude + 0.001, "lng": f.longitude + 0.001},
                    {"lat": f.latitude + 0.001, "lng": f.longitude - 0.001},
                    {"lat": f.latitude - 0.001, "lng": f.longitude - 0.001},
                    {"lat": f.latitude - 0.001, "lng": f.longitude + 0.001},
                ],
                zones=[
                    {"zone_id": "Z1", "polygon_points": [], "soil_score": round(random.uniform(0.5, 0.95), 2), "ndvi_score": round(random.uniform(0.3, 0.8), 2)},
                    {"zone_id": "Z2", "polygon_points": [], "soil_score": round(random.uniform(0.4, 0.9), 2), "ndvi_score": round(random.uniform(0.2, 0.7), 2)},
                ]
            )
            db.add(fb)

        # -- Crop Plans (matches CropPlan model: no reasoning/confidence/model_type) --
        crops = ["wheat", "rice", "soybean", "cotton", "maize"]
        for f in farms:
            for s, y in [(SeasonEnum.kharif, 2023), (SeasonEnum.rabi, 2023)]:
                cp = CropPlan(
                    id=uuid.uuid4(), farm_id=f.id, season=s, year=y,
                    recommended_crop=random.choice(crops),
                    recommended_variety="Variety-" + str(random.randint(100, 999)),
                    sowing_date=(datetime.now() - timedelta(days=random.randint(30, 180))).date(),
                    expected_investment=round(random.uniform(20000, 80000), 2),
                    status=PlanStatusEnum.active,
                )
                db.add(cp)

        # -- Rotation Plans (matches: season_sequence, rl_confidence, soil_impact_score) --
        for f in farms[:3]:
            rp = RotationPlan(
                id=uuid.uuid4(), farm_id=f.id,
                season_sequence=[
                    {"season": "kharif", "crop": "rice"},
                    {"season": "rabi", "crop": "wheat"},
                    {"season": "zaid", "crop": "moong"},
                ],
                rl_confidence=round(random.uniform(0.7, 0.95), 2),
                soil_impact_score=round(random.uniform(-0.1, 0.3), 2),
            )
            db.add(rp)

        # -- Disease Reports --
        diseases = ["Leaf Rust", "Powdery Mildew", "Late Blight", "Bacterial Wilt", "Anthracnose"]
        for f in farms:
            for _ in range(random.randint(1, 3)):
                dr = DiseaseReport(
                    id=uuid.uuid4(), farm_id=f.id,
                    image_path="/uploads/sample_leaf.jpg",
                    crop=random.choice(crops),
                    predicted_disease=random.choice(diseases),
                    confidence=round(random.uniform(0.7, 0.98), 2),
                    severity=random.choice(list(DiseaseSeverity)),
                    treatment_recommendation="Apply Mancozeb 2g/L foliar spray.",
                    language="en",
                    is_public_surveillance=True,
                    village=random.choice(["Shirur", "Baramati", "Indapur"]),
                    district="Pune",
                    created_at=datetime.now() - timedelta(days=random.randint(1, 90)),
                )
                db.add(dr)

        # -- Pest Risk Scores --
        villages = ["Shirur", "Baramati", "Indapur", "Daund", "Junnar"]
        for v in villages:
            prs = PestRiskScore(
                id=uuid.uuid4(), village_name=v, district="Pune",
                risk_score=round(random.uniform(0.2, 0.9), 2),
                week_of=datetime.now().date(),
                contributing_reports_count=random.randint(5, 50),
            )
            db.add(prs)

        # -- Livestock --
        livestock_items = []
        for f in farms[:3]:
            for atype in [AnimalType.cow, AnimalType.buffalo]:
                ls = Livestock(
                    id=uuid.uuid4(), farm_id=f.id,
                    animal_type=atype,
                    tag_id="TAG-" + str(random.randint(1000, 9999)),
                    vaccination_schedule=[{"vaccine": "FMD", "date": "2023-06-15", "next_due": "2024-06-15"}],
                    breeding_cycle={"last_calving": "2023-03-10", "expected_next": "2024-03-10"},
                    milk_yield_log=[{"date": "2023-09-01", "liters": round(random.uniform(5, 15), 1)}],
                )
                db.add(ls)
                livestock_items.append(ls)
        db.flush()

        # -- Livestock Health Reports --
        for ls in livestock_items[:3]:
            lhr = LivestockHealthReport(
                id=uuid.uuid4(), livestock_id=ls.id,
                image_path="/uploads/sample_cow.jpg",
                predicted_condition="Healthy",
                confidence=round(random.uniform(0.8, 0.97), 2),
                vet_booking_requested=False,
            )
            db.add(lhr)

        # -- Irrigation Schedules (matches: date, recommended_liters, et0_value) --
        for f in farms:
            for d_offset in range(7):
                irr = IrrigationSchedule(
                    id=uuid.uuid4(), farm_id=f.id, crop=random.choice(crops),
                    date=(datetime.now() + timedelta(days=d_offset)).date(),
                    recommended_liters=round(random.uniform(500, 3000), 1),
                    current_moisture_pct=round(random.uniform(30, 70), 1),
                    et0_value=round(random.uniform(3.0, 7.0), 2),
                )
                db.add(irr)

        # -- Soil Health Maps (no model_type) --
        for f in farms[:3]:
            grid = []
            for r in range(20):
                for c in range(20):
                    grid.append({
                        "row": r, "col": c,
                        "n": round(random.uniform(100, 400), 1),
                        "p": round(random.uniform(10, 80), 1),
                        "k": round(random.uniform(50, 300), 1),
                        "ph": round(random.uniform(5.5, 8.5), 1),
                    })
            shm = SoilHealthMap(id=uuid.uuid4(), farm_id=f.id, grid_data=grid)
            db.add(shm)

        # -- Stress Alerts (requires date) --
        for f in farms:
            db.add(StressAlert(
                id=uuid.uuid4(), farm_id=f.id,
                date=datetime.now().date(),
                ndvi_value=round(random.uniform(0.2, 0.8), 2),
                ndwi_value=round(random.uniform(0.1, 0.6), 2),
                stress_level=random.choice(list(StressLevel)),
            ))

        # -- Plant Counts (requires video_path) --
        for f in farms:
            db.add(PlantCount(
                id=uuid.uuid4(), farm_id=f.id,
                video_path="/uploads/drone_video.mp4",
                count=random.randint(800, 5000),
                gaps_detected=random.randint(0, 15),
                growth_stage="vegetative",
            ))

        # -- Grain Quality (requires image_path) --
        for f in farms:
            db.add(GrainQualityReport(
                id=uuid.uuid4(), farm_id=f.id,
                image_path="/uploads/grain_sample.jpg",
                moisture_pct=round(random.uniform(8, 16), 1),
                broken_pct=round(random.uniform(1, 10), 1),
                foreign_matter_pct=round(random.uniform(0.1, 3), 1),
                grade=random.choice(list(GrainGrade)),
            ))

        # -- Price Forecasts (uses forecast_date, no forecast_series/model_type) --
        for crop in ["wheat", "rice", "soybean"]:
            base = random.uniform(1800, 2500)
            db.add(PriceForecast(
                id=uuid.uuid4(), crop=crop, district="Pune",
                forecast_date=datetime.now().date(),
                predicted_price=round(base + 100, 2),
                low_ci=round(base - 200, 2),
                high_ci=round(base + 400, 2),
            ))

        # -- Yield Forecasts (requires forecast_date) --
        for f in farms:
            db.add(YieldForecast(
                id=uuid.uuid4(), farm_id=f.id,
                crop=random.choice(crops),
                low_kg=round(random.uniform(1500, 2500), 1),
                median_kg=round(random.uniform(2500, 4000), 1),
                high_kg=round(random.uniform(4000, 5500), 1),
                forecast_date=datetime.now().date(),
            ))

        # -- Climate Risk (uses heat_risk, horizon_years) --
        for f in farms:
            db.add(ClimateRiskScore(
                id=uuid.uuid4(), farm_id=f.id,
                drought_risk=round(random.uniform(0, 1), 2),
                flood_risk=round(random.uniform(0, 1), 2),
                heat_risk=round(random.uniform(0, 1), 2),
                horizon_years=random.choice([5, 10, 20]),
            ))

        # -- Products (no ranking_score/predicted_yield_impact_score) --
        products = []
        product_data = [
            ("DAP Fertilizer 50kg", ProductCategory.fertilizer, 1350),
            ("Urea 45kg", ProductCategory.fertilizer, 267),
            ("Syngenta Seeds Wheat", ProductCategory.seed, 450),
            ("Tata Rallis Insecticide", ProductCategory.pesticide, 780),
            ("Bio NPK Liquid", ProductCategory.fertilizer, 320),
        ]
        for name, cat, price in product_data:
            p = Product(
                id=uuid.uuid4(), name=name, category=cat, price=price,
                vendor_id=str(uuid.uuid4()), stock=random.randint(50, 500),
            )
            db.add(p)
            products.append(p)
        db.flush()

        # -- Orders (delivery_eta is DateTime) --
        for f in farms[:3]:
            o = Order(
                id=uuid.uuid4(), farm_id=f.id, product_id=products[random.randint(0, len(products)-1)].id,
                qty=random.randint(1, 10), status=random.choice(list(OrderStatus)),
                delivery_eta=datetime.now() + timedelta(days=random.randint(2, 7)),
            )
            db.add(o)

        # -- Equipment Listings (owner_id, equipment_type, daily_rate, lat, lng) --
        equip_listings = []
        equip_data = [
            ("Mahindra 575 Tractor", "tractor"),
            ("John Deere Harvester", "harvester"),
            ("Rotavator Attachment", "rotavator"),
        ]
        for name, etype in equip_data:
            el = EquipmentListing(
                id=uuid.uuid4(), owner_id=str(uuid.uuid4()),
                equipment_type=etype,
                latitude=18.52 + random.uniform(-0.5, 0.5),
                longitude=73.85 + random.uniform(-0.5, 0.5),
                daily_rate=round(random.uniform(300, 1500), 2),
                available=True,
            )
            db.add(el)
            equip_listings.append(el)
        db.flush()

        # -- Equipment Bookings --
        for i, f in enumerate(farms[:2]):
            eb = EquipmentBooking(
                id=uuid.uuid4(), listing_id=equip_listings[i].id, farm_id=f.id,
                start_date=(datetime.now() + timedelta(days=3)).date(),
                end_date=(datetime.now() + timedelta(days=5)).date(),
                status="confirmed",
            )
            db.add(eb)

        # -- Labor Listings (gang_id, skill, daily_wage, lat, lng, availability_calendar) --
        labor_listings_objs = []
        labor_data = [
            ("Harvesting Gang (5)", "harvesting"),
            ("Sowing Team (3)", "sowing"),
            ("Spraying Unit (2)", "spraying"),
        ]
        for name, skill in labor_data:
            ll = LaborListing(
                id=uuid.uuid4(), gang_id=str(uuid.uuid4()),
                skill=skill,
                daily_wage=round(random.uniform(800, 2500), 2),
                latitude=18.52 + random.uniform(-0.5, 0.5),
                longitude=73.85 + random.uniform(-0.5, 0.5),
                availability_calendar={"2023-10": ["01", "02", "03", "04", "05"]},
            )
            db.add(ll)
            labor_listings_objs.append(ll)
        db.flush()

        # -- Labor Bookings --
        lb = LaborBooking(
            id=uuid.uuid4(), listing_id=labor_listings_objs[0].id, farm_id=farms[0].id,
            task_type="harvesting",
            date=(datetime.now() + timedelta(days=7)).date(),
            status="confirmed",
        )
        db.add(lb)

        # -- Buyer Requirements (no buyer_type column in this model) --
        buyer_reqs = []
        for b in buyers:
            br = BuyerRequirement(
                id=uuid.uuid4(), buyer_id=str(b.id),
                crop=random.choice(["wheat", "rice", "soybean"]),
                qty_needed_kg=round(random.uniform(5000, 50000), 1),
                quality_grade="A",
                price_offered=round(random.uniform(2000, 2800), 2),
            )
            db.add(br)
            buyer_reqs.append(br)
        db.flush()

        # -- Exchange Matches --
        for br in buyer_reqs[:2]:
            em = ExchangeMatch(
                id=uuid.uuid4(), buyer_requirement_id=br.id,
                farm_ids=[str(f.id) for f in farms[:3]],
                aggregated_qty_kg=round(random.uniform(3000, 30000), 1),
                match_score=round(random.uniform(0.7, 0.99), 2),
                status="fulfilled",
            )
            db.add(em)

        # -- B2B Standing Orders --
        for b in buyers:
            db.add(B2BStandingOrder(
                id=uuid.uuid4(), buyer_id=str(b.id),
                buyer_type=random.choice(list(BuyerType)),
                crop=random.choice(crops),
                recurring_qty_kg=round(random.uniform(5000, 25000), 1),
                fulfilment_status="pending",
            ))

        # -- Transactions (user_id, not farm_id) --
        txns = []
        for f_user in farmers:
            for _ in range(random.randint(2, 5)):
                t = Transaction(
                    id=uuid.uuid4(), user_id=f_user.id,
                    amount=round(random.uniform(500, 50000), 2),
                    type=random.choice(list(TransactionType)),
                    status=random.choice(list(TransactionStatus)),
                    related_entity_id=str(uuid.uuid4()),
                    tag=random.choice(["fertilizer", "seed", "rental", "loan", "insurance"]),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 180)),
                )
                db.add(t)
                txns.append(t)

        # -- Loans (no approved/model_type columns) --
        for f in farms[:3]:
            loan = Loan(
                id=uuid.uuid4(), farm_id=f.id,
                amount=round(random.uniform(25000, 200000), 2),
                credit_score=random.randint(550, 850),
                status=LoanStatus.disbursed,
                lender="AgriFinance Partner Network",
                top_factors=["High Yield Stability", "Timely Repayments", "Good Soil Score"],
                terms={"interest_rate": 6.5, "tenure_months": 12, "emi": 4316},
            )
            db.add(loan)

        # -- Warehouse Bookings --
        for f in farms[:2]:
            wb = WarehouseBooking(
                id=uuid.uuid4(), farm_id=f.id, facility_id=str(uuid.uuid4()),
                qty_kg=round(random.uniform(1000, 10000), 1),
                quality_grade="FAQ",
                e_nwr_id="eNWR-" + str(random.randint(10000, 99999)),
                loan_eligible=True,
            )
            db.add(wb)

        # -- Insurance Claims (evidence dict, settlement_amount) --
        for f in farms[:2]:
            ic = InsuranceClaim(
                id=uuid.uuid4(), farm_id=f.id,
                policy_id="POL-" + str(random.randint(1000, 9999)),
                loss_event_date=(datetime.now() - timedelta(days=random.randint(10, 60))).date(),
                evidence={"photos": ["/evidence/photo1.jpg"], "ndvi_drop": 0.35},
                status=random.choice(list(ClaimStatus)),
                settlement_amount=round(random.uniform(10000, 50000), 2),
            )
            db.add(ic)

        # -- Gov Schemes --
        schemes = []
        scheme_data = [
            ("PM-KISAN Samman Nidhi", SchemeLevel.central, 6000, "2024-03-31"),
            ("PMFBY Crop Insurance", SchemeLevel.central, 25000, "2024-01-15"),
            ("KCC - Kisan Credit Card", SchemeLevel.central, 300000, "2024-06-30"),
            ("PM-KUSUM Solar Pump", SchemeLevel.state, 150000, "2024-02-28"),
        ]
        for name, level, amount, deadline in scheme_data:
            s = Scheme(
                id=uuid.uuid4(), name=name, level=level,
                benefit_amount=amount,
                deadline=date.fromisoformat(deadline),
                criteria={"min_landholding_ha": 0, "max_landholding_ha": 5, "bank_linked": True},
            )
            db.add(s)
            schemes.append(s)
        db.flush()

        # -- Eligibility Matches (no match_score) --
        for f in farms:
            for s in random.sample(schemes, k=min(3, len(schemes))):
                em = EligibilityMatch(
                    id=uuid.uuid4(), farm_id=f.id, scheme_id=s.id,
                    eligible=random.choice([True, True, False]),
                )
                db.add(em)

        # -- Documents --
        for f in farms[:3]:
            for dt in [DocType.aadhaar, DocType.land_record]:
                doc = Document(
                    id=uuid.uuid4(), farm_id=f.id, doc_type=dt,
                    file_path="/uploads/" + dt.value + "_" + str(f.id) + ".jpg",
                    ocr_extracted={"Name": "Ramesh Kumar", "ID": "XXXX1234"},
                    verified=True,
                )
                db.add(doc)

        # -- Alerts (type column, message column) --
        for f in farms:
            for _ in range(random.randint(1, 3)):
                db.add(Alert(
                    id=uuid.uuid4(), farm_id=f.id,
                    type=random.choice(list(AlertType)),
                    message=random.choice([
                        "Heavy rainfall expected tomorrow in your district.",
                        "Fall Armyworm risk elevated for maize crops.",
                        "Optimal spray window: next 48 hours.",
                        "PM-KISAN installment credited to linked account.",
                    ]),
                    read=False,
                ))

        # -- Season Reports --
        for f in farms:
            db.add(SeasonReport(
                id=uuid.uuid4(), farm_id=f.id,
                season="kharif", year=2023,
                investment=round(random.uniform(30000, 80000), 2),
                income=round(random.uniform(80000, 200000), 2),
                profit=round(random.uniform(20000, 120000), 2),
                roi_pct=round(random.uniform(50, 250), 1),
                suggestions=["Increase Phosphorus during vegetative stage.", "Switch to drip irrigation.", "Consider crop insurance for next season."],
            ))

        # -- Grower Scores (no factors column) --
        for f in farms:
            db.add(GrowerScore(
                id=uuid.uuid4(), farm_id=f.id,
                score=random.randint(55, 95),
                district_percentile=random.randint(50, 98),
            ))

        # -- SHG & FPO --
        shg = SHGGroup(
            id=uuid.uuid4(), name="Shirur Progressive SHG",
            member_farm_ids=[str(f.id) for f in farms[:3]],
        )
        db.add(shg)

        fpo = FPOGroup(
            id=uuid.uuid4(), name="Maha-Agri FPO Federation",
            member_farm_ids=[str(f.id) for f in farms],
            pooled_purchases=[{"item": "DAP 50kg", "qty": 100, "total_price": 135000}],
            pooled_sales=[{"crop": "wheat", "qty_kg": 50000, "buyer": "ITC"}],
            scheme_compliance={"fpo_registration": True, "gst_filed": True},
        )
        db.add(fpo)

        # -- Support Tickets --
        db.add(SupportTicket(
            id=uuid.uuid4(), farm_id=farms[0].id,
            issue="Need help applying for PM-KISAN",
            status=TicketStatus.open,
            notes="",
        ))

        # -- Advanced AI: Causal Simulation (projected_delta is dict) --
        db.add(CausalSimulation(
            id=uuid.uuid4(), farm_id=farms[0].id,
            current_decision={"irrigation": 100, "fertilizer_kg": 50, "sowing_week": 0},
            proposed_change={"irrigation": 120, "fertilizer_kg": 70, "sowing_week": -1},
            projected_delta={"yield_delta": 350.5, "profit_delta": 7500.0, "causal_estimate": 350.5, "naive_estimate": 520.0},
            explanation="DoWhy isolates the true causal effect of increased fertilizer.",
        ))

        # -- FL Training Runs --
        db.add(FLTrainingRun(
            id=uuid.uuid4(), round_number=5,
            participating_farms=[str(f.id) for f in farms[:4]],
            aggregate_accuracy=0.89,
        ))

        # Commit
        db.commit()
        print("[OK] Seeded: 5 farmers, 3 buyers, 5 farms")
        for user, farm in zip(farmers, farms):
            print(f"[FARM] {user.email}: {farm.id}")
        for user in farmers:
            print(f"[USER] {user.email} / {'demo1234' if user.email == 'demo@agri.test' else 'farmer1234'}")
        for user in buyers:
            print(f"[USER] {user.email} / buyer1234")
        print("[OK] All feature group data populated.")

    except Exception as e:
        db.rollback()
        print("[ERROR] Seed failed: " + str(e))
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
