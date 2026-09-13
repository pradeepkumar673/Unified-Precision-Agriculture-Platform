"""SQLAlchemy 2.0 models for the advanced_ai feature-group.

Covers MASTER-SPEC features #55 (Voice Query), #56 (Multimodal Query),
#57 (Federated Learning), and #58 (What-If / Causal Simulation).
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


# --------------------------------------------------------------------------- #
# voice_queries (#55 Voice Query)
# --------------------------------------------------------------------------- #
class VoiceQuery(Base):
    __tablename__ = "voice_queries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    audio_path: Mapped[str] = mapped_column(String(500), nullable=False)
    transcribed_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    language: Mapped[str] = mapped_column(String(20), default="en", nullable=False)
    response_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# multimodal_queries (#56 Multimodal Query)
# --------------------------------------------------------------------------- #
class MultimodalQuery(Base):
    __tablename__ = "multimodal_queries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    input_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    combined_response: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# fl_training_runs (#57 Federated Learning)
# --------------------------------------------------------------------------- #
class FLTrainingRun(Base):
    __tablename__ = "fl_training_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    participating_farms: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    aggregate_accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# causal_simulations (#58 What-If / Causal Simulation)
# --------------------------------------------------------------------------- #
class CausalSimulation(Base):
    __tablename__ = "causal_simulations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    current_decision: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    proposed_change: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    projected_delta: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
