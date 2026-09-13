"""Pydantic v2 schemas for the advanced_ai feature-group."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# --------------------------------------------------------------------------- #
# Voice Query (#55)
# --------------------------------------------------------------------------- #
class VoiceQueryResponse(BaseModel):
    query_id: UUID
    farm_id: UUID
    audio_path: str
    transcribed_text: str
    language: str
    response_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Multimodal Query (#56)
# --------------------------------------------------------------------------- #
class MultimodalQueryResponse(BaseModel):
    query_id: UUID
    farm_id: UUID
    image_path: Optional[str] = None
    input_text: Optional[str] = None
    combined_response: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Federated Learning (#57)
# --------------------------------------------------------------------------- #
class FLTriggerResponse(BaseModel):
    run_id: UUID
    rounds_completed: int
    participating_farm_count: int
    round_accuracies: List[float]
    aggregate_accuracy: float
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Causal / What-If Simulation (#58)
# --------------------------------------------------------------------------- #
class WhatIfRequest(BaseModel):
    farm_id: UUID
    current_decision: Dict[str, Any]
    proposed_change: Dict[str, Any]


class WhatIfResponse(BaseModel):
    simulation_id: UUID
    farm_id: UUID
    causal_estimate: float
    naive_correlation_estimate: float
    confounding_bias_kg_ha: float          # naive - causal; shows cost of ignoring confounders
    projected_yield_delta_kg_ha: float
    projected_profit_delta_inr_ha: float
    explanation: str
    projected_delta: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
