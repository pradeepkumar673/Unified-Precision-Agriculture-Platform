"""Security utilities: password hashing, JWT access + refresh tokens."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"
_PBKDF2_ITERS = 120_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERS)
    return f"pbkdf2${_PBKDF2_ITERS}${salt}${dk.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        scheme, iters, salt, digest = hashed.split("$", 3)
        if scheme != "pbkdf2":
            return False
        dk = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iters)
        )
        return hmac.compare_digest(dk.hex(), digest)
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, extra: Optional[dict] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Long-lived token (30 days). Store server-side hash to allow revocation."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") not in ("access", None):   # accept legacy tokens without type field
            return None
        return str(payload.get("sub") or "")
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return str(payload.get("sub") or "")
    except JWTError:
        return None
