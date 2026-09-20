"""Database engine, session factory, and Base declarative.

Supports both SQLite (development) and PostgreSQL (production).
In production, set DATABASE_URL=postgresql://user:pass@host:5432/dbname
"""
import os
import uuid
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.types import CHAR, TypeDecorator


# ── SQLite & Postgres compatible UUID type ────────────────────────────────────
class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.

    Uses PostgreSQL's native UUID type, otherwise stores as CHAR(36).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        if not isinstance(value, uuid.UUID):
            return str(uuid.UUID(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


# ── Engine ────────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=True,
    # Connection pooling — only meaningful for PostgreSQL
    **({} if _is_sqlite else {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_recycle": 1800,   # recycle connections after 30 min to avoid stale connections
    }),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Dependency ────────────────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session and guarantees cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
