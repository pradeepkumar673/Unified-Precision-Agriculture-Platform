"""Reusable FastAPI dependencies for authentication and authorization.

Every protected endpoint should inject `current_user = Depends(get_current_user)`.
For admin-only endpoints, inject `admin = Depends(require_admin)`.
"""
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_access_token
from app.models.farm import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=True)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Token expired or invalid. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the JWT and return the authenticated User.

    Raises HTTP 401 if the token is missing, invalid, or the user no longer exists.
    """
    user_id = decode_access_token(token)
    if not user_id:
        raise _CREDENTIALS_EXCEPTION
    try:
        uid = UUID(user_id)
    except ValueError:
        raise _CREDENTIALS_EXCEPTION

    user = db.get(User, uid)
    if user is None:
        raise _CREDENTIALS_EXCEPTION
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restrict endpoint to admin role only."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user
