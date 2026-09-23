import os
import sys

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.db import engine, Base
from app.models.marketplace import BuyerProfile

def seed_buyers():
    print("Seeding buyers...")
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    with Session(engine) as db:
        # Check if already seeded
        existing = db.query(BuyerProfile).first()
        if existing:
            print("Buyers already exist in the database. Deleting them to reseed...")
            db.query(BuyerProfile).delete()
            db.commit()

        buyers = [
            BuyerProfile(
                name="Patanjali / Agro Foods Milling Ltd.",
                buyer_type="Industrial Processing Plant",
                district="Nashik",
                markup_pct=1.05,
                tag="Top Matched Buyer",
                perks="Free farm gate pickup included",
                is_verified=True
            ),
            BuyerProfile(
                name="Nashik Wholesale Trading Co.",
                buyer_type="Registered APMC Mandi Trader",
                district="Nashik",
                markup_pct=1.01,
                tag=None,
                perks="Farmer brings produce to Nashik Yard",
                is_verified=True
            ),
            BuyerProfile(
                name="MahaAgro FPO Bulk Consortium",
                buyer_type="Farmer Producer Organization",
                district="Nashik",
                markup_pct=1.02,
                tag=None,
                perks="Subsidized bagging & pooling provided",
                is_verified=True
            )
        ]
        
        db.add_all(buyers)
        db.commit()
        print("Successfully seeded buyers.")

if __name__ == "__main__":
    seed_buyers()
