import uuid
from datetime import datetime, timezone
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.marketplace import EquipmentListing
from app.core.db import SessionLocal

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(EquipmentListing).count() > 0:
            print("Equipment already seeded.")
            return

        now = datetime.now(timezone.utc)
        equipments = [
            EquipmentListing(
                id=uuid.uuid4(),
                owner_id="John Deere Cooperative",
                equipment_type="John Deere Combine Harvester X9",
                latitude=20.0123,
                longitude=73.7890,
                daily_rate=15000.0,
                available=True,
                created_at=now,
                updated_at=now
            ),
            EquipmentListing(
                id=uuid.uuid4(),
                owner_id="Mahindra Farm Equipment",
                equipment_type="Mahindra Arjun Novo 605 DI-i Tractor",
                latitude=20.0211,
                longitude=73.7912,
                daily_rate=4500.0,
                available=True,
                created_at=now,
                updated_at=now
            ),
            EquipmentListing(
                id=uuid.uuid4(),
                owner_id="Local Krishi Kendra",
                equipment_type="Pneumatic Precision Planter",
                latitude=20.0345,
                longitude=73.7765,
                daily_rate=3200.0,
                available=True,
                created_at=now,
                updated_at=now
            )
        ]

        db.add_all(equipments)
        db.commit()
        print(f"Successfully seeded {len(equipments)} equipment listings.")

    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
