from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.farm import Farm, User, UserRole
from app.schemas.auth import FarmSummary, LoginRequest, SignupRequest, TokenResponse, UserRead

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
