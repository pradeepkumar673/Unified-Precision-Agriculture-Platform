"""API router for marketplace endpoints.

Covers MASTER-SPEC features #6, #7, #9, #24, #44, #45, #52, #55, #26.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.api.websockets import manager
from app.models.farm import Farm
from app.models.marketplace import (
    B2BStandingOrder,
    BuyerRequirement,
    EquipmentBooking,
    EquipmentListing,
    LaborBooking,
    LaborListing,
    Order,
    OrderStatus,
    Product,
    BuyerProfile,
)
from app.schemas.marketplace import (
    B2BStandingOrderCreate,
    B2BStandingOrderRead,
    BuyerRequirementCreate,
    BuyerRequirementRead,
    DeliveryStatusResponse,
    EquipmentBookingCreate,
    EquipmentBookingRead,
    ExchangeMatchRead,
    ExchangeMatchRequest,
    EquipmentListingRead,
    LaborListingRead,
    LaborBookingCreate,
    LaborBookingRead,
    OrderCreate,
    OrderRead,
    ProductRead,
    ProductCreate,
    EquipmentListingCreate,
    BuyerProfileRead,
)
from app.services.marketplace import (
    calculate_equipment_eta,
    match_exchange_crops,
    rank_products,
)

router = APIRouter(prefix="/api/v1/marketplace", tags=["marketplace"])


@router.websocket("/ws/{farm_id}")
async def websocket_endpoint(websocket: WebSocket, farm_id: str):
    """WebSocket endpoint for real-time marketplace updates."""
    await manager.connect(websocket, farm_id)
    try:
        while True:
            # We just keep the connection open and listen for disconnects
            # Clients primarily receive data, but we can accept messages if needed
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, farm_id)


@router.get("/equipment", response_model=List[EquipmentListingRead])
def get_equipment_listings(db: Session = Depends(get_db)):
    """Return currently available equipment listings for the rental UI."""
    return db.execute(
        select(EquipmentListing).where(EquipmentListing.available.is_(True))
    ).scalars().all()

@router.post("/equipment", response_model=EquipmentListingRead, status_code=status.HTTP_201_CREATED)
async def create_equipment_listing(
    payload: EquipmentListingCreate,
    db: Session = Depends(get_db),
):
    """Create a new equipment rental listing and broadcast to connected farmers."""
    listing = EquipmentListing(**payload.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    
    # Broadcast to all connected clients
    listing_data = EquipmentListingRead.model_validate(listing).model_dump(mode="json")
    await manager.broadcast({
        "type": "NEW_EQUIPMENT",
        "data": listing_data
    })
    
    return listing


@router.get("/labor", response_model=List[LaborListingRead])
def get_labor_listings(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Return labor listings; availability is checked when booking."""
    return db.execute(select(LaborListing).offset(offset).limit(limit)).scalars().all()


# --------------------------------------------------------------------------- #
# #6 Inputs Marketplace & #44 AI Input Ranking
# --------------------------------------------------------------------------- #
@router.get("/products", response_model=List[ProductRead])
def get_products(
    farm_id: Optional[UUID] = Query(None, description="Optional Farm UUID to tailor rankings"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return all products ranked by trained ML scoring model (e.g. LightGBM)."""
    farm = None
    if farm_id:
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()

    stmt = select(Product).offset(offset).limit(limit)
    products = db.execute(stmt).scalars().all()
    ranked = rank_products(products, farm)
    return ranked


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
):
    """Create a new product listing and broadcast to connected farmers."""
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Broadcast to all connected clients
    product_data = ProductRead.model_validate(product).model_dump(mode="json")
    await manager.broadcast({
        "type": "NEW_PRODUCT",
        "data": product_data
    })
    
    return product


@router.post("/order", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
):
    """Place an order for agricultural inputs."""
    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    product = db.execute(select(Product).where(Product.id == payload.product_id)).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock < payload.qty:
        raise HTTPException(status_code=409, detail="Insufficient stock")

    product.stock -= payload.qty

    now_utc = datetime.now(timezone.utc)
    eta = now_utc + timedelta(days=3)

    order = Order(
        farm_id=payload.farm_id,
        product_id=payload.product_id,
        qty=payload.qty,
        status=OrderStatus.placed,
        delivery_eta=eta,
        critical_window_end=None,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


# --------------------------------------------------------------------------- #
# #7 Machinery Rental & #24 Dynamic Routing
# --------------------------------------------------------------------------- #
@router.get(
    "/equipment",
    response_model=list[EquipmentListingRead],
    status_code=status.HTTP_200_OK,
)
def get_equipment(db: Session = Depends(get_db)):
    """List all available equipment listings."""
    listings = db.execute(
        select(EquipmentListing).where(EquipmentListing.available == True)
    ).scalars().all()
    return listings

@router.post(
    "/equipment/book",
    response_model=EquipmentBookingRead,
    status_code=status.HTTP_201_CREATED,
)
def book_equipment(
    payload: EquipmentBookingCreate,
    db: Session = Depends(get_db),
):
    """Book machinery with dynamic routing ETA computation."""
    listing = db.execute(
        select(EquipmentListing).where(EquipmentListing.id == payload.listing_id)
    ).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Equipment listing not found")

    if not listing.available:
        raise HTTPException(status_code=409, detail="Equipment listing is currently unavailable")

    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Check date overlap conflicts
    conflict_stmt = select(EquipmentBooking).where(
        EquipmentBooking.listing_id == payload.listing_id,
        EquipmentBooking.status != "cancelled",
        and_(
            payload.start_date <= EquipmentBooking.end_date,
            payload.end_date >= EquipmentBooking.start_date,
        ),
    )
    conflict = db.execute(conflict_stmt).scalars().first()
    if conflict:
        raise HTTPException(status_code=409, detail="Listing already booked for those dates")

    route_eta = calculate_equipment_eta(listing, farm, payload.start_date)

    booking = EquipmentBooking(
        listing_id=payload.listing_id,
        farm_id=payload.farm_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status="confirmed",
        assigned_route_eta=route_eta,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# --------------------------------------------------------------------------- #
# #52 Labor Marketplace
# --------------------------------------------------------------------------- #
@router.post(
    "/labor/book",
    response_model=LaborBookingRead,
    status_code=status.HTTP_201_CREATED,
)
def book_labor(
    payload: LaborBookingCreate,
    db: Session = Depends(get_db),
):
    """Book agricultural labor gang."""
    listing = db.execute(
        select(LaborListing).where(LaborListing.id == payload.listing_id)
    ).scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Labor listing not found")

    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Check if already booked for that date
    conflict_stmt = select(LaborBooking).where(
        LaborBooking.listing_id == payload.listing_id,
        LaborBooking.date == payload.date,
        LaborBooking.status != "cancelled",
    )
    conflict = db.execute(conflict_stmt).scalars().first()
    if conflict:
        raise HTTPException(status_code=409, detail="Labor listing already booked for that date")

    booking = LaborBooking(
        listing_id=payload.listing_id,
        farm_id=payload.farm_id,
        task_type=payload.task_type,
        date=payload.date,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# --------------------------------------------------------------------------- #
# #9 Harvest & Market & #26 Learned Buyer Matching
# --------------------------------------------------------------------------- #
@router.post(
    "/buyer-requirement",
    response_model=BuyerRequirementRead,
    status_code=status.HTTP_201_CREATED,
)
def create_buyer_requirement(
    payload: BuyerRequirementCreate,
    db: Session = Depends(get_db),
):
    """Create a buyer crop demand requirement."""
    req = BuyerRequirement(
        buyer_id=payload.buyer_id,
        crop=payload.crop,
        qty_needed_kg=payload.qty_needed_kg,
        quality_grade=payload.quality_grade,
        price_offered=payload.price_offered,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.post(
    "/exchange-match",
    response_model=ExchangeMatchRead,
    status_code=status.HTTP_201_CREATED,
)
def match_exchange(
    payload: ExchangeMatchRequest,
    db: Session = Depends(get_db),
):
    """Match buyer requirements with farmer crop supplies."""
    req = db.execute(
        select(BuyerRequirement).where(BuyerRequirement.id == payload.buyer_requirement_id)
    ).scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Buyer requirement not found")

    farm_ids, aggregated_qty, match_score = match_exchange_crops(db, req)

    from app.models.marketplace import ExchangeMatch

    match = ExchangeMatch(
        buyer_requirement_id=req.id,
        farm_ids=farm_ids,
        aggregated_qty_kg=aggregated_qty,
        match_score=match_score,
        status="fulfilled",
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


# --------------------------------------------------------------------------- #
# #45 Delivery Tracking
# --------------------------------------------------------------------------- #
@router.get("/delivery-status/{order_id}", response_model=DeliveryStatusResponse)
def get_delivery_status(
    order_id: UUID,
    db: Session = Depends(get_db),
):
    """Get real-time order delivery status and delay indicator."""
    order = db.execute(select(Order).where(Order.id == order_id)).scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    product = db.execute(select(Product).where(Product.id == order.product_id)).scalars().first()
    product_name = product.name if product else "Unknown Product"

    now_utc = datetime.now(timezone.utc)
    # Check if delivery is delayed beyond critical window
    delayed = False
    if order.critical_window_end:
        critical_tz = order.critical_window_end
        if critical_tz.tzinfo is None:
            critical_tz = critical_tz.replace(tzinfo=timezone.utc)
        delayed = now_utc > critical_tz
    elif order.status == OrderStatus.delayed:
        delayed = True

    return DeliveryStatusResponse(
        id=order.id,
        farm_id=order.farm_id,
        product_id=order.product_id,
        qty=order.qty,
        status=order.status,
        delivery_eta=order.delivery_eta,
        critical_window_end=order.critical_window_end,
        created_at=order.created_at,
        delayed=delayed,
        product_name=product_name,
    )


@router.get("/delivery-status/active/{farm_id}", response_model=DeliveryStatusResponse)
def get_active_delivery(
    farm_id: UUID,
    db: Session = Depends(get_db),
):
    """Get the most recent active order for the farmer."""
    order = db.execute(
        select(Order)
        .where(Order.farm_id == farm_id)
        .order_by(Order.created_at.desc())
    ).scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="No active orders found for this farm")
        
    return get_delivery_status(order_id=order.id, db=db)


@router.post("/simulate-delivery-update/{order_id}")
async def simulate_delivery_update(
    order_id: UUID,
    db: Session = Depends(get_db),
):
    """Simulate a GPS ping from a truck by updating ETA and broadcasting a WS message."""
    order = db.execute(select(Order).where(Order.id == order_id)).scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Simulate truck moving closer
    order.delivery_eta = order.delivery_eta - timedelta(minutes=15)
    db.commit()
    db.refresh(order)
    
    # Broadcast WS message to the farm
    await manager.broadcast_to(str(order.farm_id), {
        "type": "DELIVERY_UPDATE",
        "data": {
            "order_id": str(order.id),
            "status": order.status.value,
            "delivery_eta": order.delivery_eta.isoformat(),
            "remaining_km": round(max(0.5, 18.2 - 2.5), 1), # Simulated decreasing distance
            "speed_kmh": 45
        }
    })
    
    return {"message": "Simulated delivery update broadcasted"}


# --------------------------------------------------------------------------- #
# #55 B2B Channel
# --------------------------------------------------------------------------- #
@router.post(
    "/b2b/standing-order",
    response_model=B2BStandingOrderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_standing_order(
    payload: B2BStandingOrderCreate,
    db: Session = Depends(get_db),
):
    """Create recurring B2B standing order."""
    standing_order = B2BStandingOrder(
        buyer_id=payload.buyer_id,
        buyer_type=payload.buyer_type,
        crop=payload.crop,
        recurring_qty_kg=payload.recurring_qty_kg,
        fulfilment_status="pending",
    )
    db.add(standing_order)
    db.commit()
    db.refresh(standing_order)
    return standing_order


@router.get("/buyers", response_model=List[BuyerProfileRead])
def get_buyers(
    district: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return active buyers."""
    query = select(BuyerProfile).where(BuyerProfile.is_verified.is_(True))
    if district:
        query = query.where(BuyerProfile.district == district)
    return db.execute(query).scalars().all()
