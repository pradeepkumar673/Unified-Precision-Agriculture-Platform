import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.db import engine, Base
from app.models.marketplace import Product, Order, OrderStatus
from app.models.farm import Farm

def seed_delivery():
    print("Seeding delivery order...")
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    with Session(engine) as db:
        # Get the first farm or create one if it doesn't exist
        farm = db.query(Farm).first()
        if not farm:
            print("No farm found to attach the order to. Cannot seed delivery.")
            return

        # Check if already seeded a product
        product = db.query(Product).filter(Product.name == "High-Yield DAP Fertilizer").first()
        if not product:
            product = Product(
                name="High-Yield DAP Fertilizer",
                category="fertilizer",
                price=1250.0,
                vendor_id="vendor-123",
                stock=500
            )
            db.add(product)
            db.commit()
            db.refresh(product)

        # Check if there is an active order
        order = db.query(Order).filter(Order.farm_id == farm.id).first()
        if not order:
            order = Order(
                farm_id=farm.id,
                product_id=product.id,
                qty=10,
                status=OrderStatus.shipped,
                delivery_eta=datetime.now(timezone.utc) + timedelta(hours=2),
                critical_window_end=datetime.now(timezone.utc) + timedelta(hours=5)
            )
            db.add(order)
            db.commit()
            db.refresh(order)
            print(f"Successfully seeded order {order.id} for farm {farm.id}")
        else:
            # Update existing order to ensure it's in transit
            order.status = OrderStatus.shipped
            order.delivery_eta = datetime.now(timezone.utc) + timedelta(hours=2)
            db.commit()
            print(f"Updated existing order {order.id} for farm {farm.id} to shipped status")

if __name__ == "__main__":
    seed_delivery()
