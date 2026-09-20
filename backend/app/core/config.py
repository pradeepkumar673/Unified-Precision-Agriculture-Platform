import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Unified Precision Agriculture Platform"
    API_V1_STR: str = "/api/v1"

    # ── Auth ──────────────────────────────────────────────────────────────────
    # MUST be overridden in production via environment variable.
    # Generate with: python -c "import secrets; print(secrets.token_hex(64))"
    SECRET_KEY: str = "supersecretkey-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15           # short-lived access tokens
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30             # long-lived refresh tokens

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./app.db"        # override with postgresql:// in prod
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # ── CORS ──────────────────────────────────────────────────────────────────
    # In production set to your actual frontend domain(s), e.g.:
    # BACKEND_CORS_ORIGINS=["https://agriplatform.in"]
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Payments ──────────────────────────────────────────────────────────────
    RAZORPAY_KEY_ID: str = "rzp_test_mock"
    RAZORPAY_KEY_SECRET: str = "mock_secret"
    RAZORPAY_WEBHOOK_SECRET: str = ""               # set for webhook signature verification

    # ── CEA / IoT Device Auth ─────────────────────────────────────────────────
    CEA_DEVICE_API_KEY: str = "test_device_key_123" # override with strong random value in prod

    # ── External Data APIs ────────────────────────────────────────────────────
    DATA_GOV_API_KEY: str = ""                      # data.gov.in AGMARKNET mandi prices
    OPENWEATHERMAP_API_KEY: str = ""                # live ET0 weather for irrigation

    # ── Notifications ─────────────────────────────────────────────────────────
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@agriplatform.in"
    MSG91_API_KEY: str = ""                         # Indian SMS gateway
    MSG91_SENDER_ID: str = "AGRPLT"
    TWILIO_ACCOUNT_SID: str = ""                    # fallback SMS
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # ── Monitoring ────────────────────────────────────────────────────────────
    SENTRY_DSN: str = ""                            # leave blank to disable Sentry
    LOG_LEVEL: str = "INFO"

    # ── Google OAuth ──────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
