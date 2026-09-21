from typing import List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.farm import UserRole


class SignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str
    role: UserRole = UserRole.farmer


class LoginRequest(BaseModel):
    email: str
    password: str


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str


class SetRoleRequest(BaseModel):
    role: str


class FarmSummary(BaseModel):
    id: UUID
    name: str


class UserRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    farms: List[FarmSummary] = []
    is_new_user: bool = False
