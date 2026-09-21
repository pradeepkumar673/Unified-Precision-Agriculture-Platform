from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.farm import Farm, User, UserRole
from app.schemas.auth import FarmSummary, LoginRequest, SignupRequest, TokenResponse, UserRead, SendOTPRequest, VerifyOTPRequest, SetRoleRequest

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _token_payload(db: Session, user: User) -> TokenResponse:
    farms = db.scalars(select(Farm).where(Farm.user_id == user.id)).all()
    token = create_access_token(str(user.id), extra={"email": user.email, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user=UserRead(id=user.id, email=user.email, full_name=user.full_name, role=user.role),
        farms=[FarmSummary(id=f.id, name=f.name) for f in farms],
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role or UserRole.farmer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_payload(db, user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _token_payload(db, user)


@router.post("/send-otp")
def send_otp(payload: SendOTPRequest):
    # In a real app, this would integrate with an SMS gateway (Twilio, SNS, Msg91).
    # For now, it's a mock that always succeeds and expects '123456'.
    return {"status": "success", "message": "OTP dispatched."}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    if payload.otp != "123456":
        raise HTTPException(status_code=401, detail="Invalid OTP code.")
    
    # Format phone number for consistency
    clean_phone = payload.phone.strip()
    
    # Try to find user by phone number
    user = db.scalar(select(User).where(User.phone == clean_phone))
    is_new = False
    
    if user is None:
        # Create a new user since they verified their phone
        # We generate a mock email since email is required, but phone is the primary identifier for OTP users
        is_new = True
        user = User(
            email=f"{clean_phone.replace('+', '')}@phone.local",
            hashed_password=hash_password(payload.otp), # arbitrary
            full_name="New Farmer",
            role=UserRole.farmer,
            phone=clean_phone
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    token_response = _token_payload(db, user)
    token_response.is_new_user = is_new
    return token_response


@router.post("/set-role")
def set_role(
    payload: SetRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates the role of the currently authenticated user.
    """
    role_str = payload.role.lower()
    try:
        new_role = UserRole(role_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    current_user.role = new_role
    db.commit()
    db.refresh(current_user)
    
    return {"status": "success", "role": current_user.role.value}
