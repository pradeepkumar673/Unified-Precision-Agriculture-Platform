"""API router for advanced_ai endpoints.

Routes:
  POST /api/v1/advanced_ai/voice-query           — Whisper transcription + keyword response
  POST /api/v1/advanced_ai/multimodal-query       — Image disease detect + text fusion
  POST /api/v1/advanced_ai/federated/trigger-round — Real FedAvg FL simulation, 5 rounds
  POST /api/v1/advanced_ai/whatif-simulate         — DoWhy causal backdoor adjustment
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.advanced_ai import (
    CausalSimulation,
    FLTrainingRun,
    MultimodalQuery,
    VoiceQuery,
)
from app.models.farm import Farm
from app.schemas.advanced_ai import (
    FLTriggerResponse,
    MultimodalQueryResponse,
    VoiceQueryResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services.advanced_ai import (
    process_multimodal_query,
    run_federated_learning_round,
    run_whatif_simulation,
    transcribe_and_respond,
)

router = APIRouter(prefix="/api/v1/advanced_ai", tags=["advanced_ai"])


# ---------------------------------------------------------------------------
# #55 Voice Query
# ---------------------------------------------------------------------------
@router.post(
    "/voice-query",
    response_model=VoiceQueryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def voice_query(
    farm_id: UUID = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Transcribe audio with openai-whisper 'base' model and return agri response."""
    farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Save uploaded audio
    upload_dir = os.path.join("backend", "media", "voice", str(farm_id))
    os.makedirs(upload_dir, exist_ok=True)
    filename = audio_file.filename or f"audio_{uuid.uuid4().hex[:8]}.wav"
    audio_path = os.path.join(upload_dir, filename)
    content = await audio_file.read()
    with open(audio_path, "wb") as f:
        f.write(content)

    transcribed_text, language, response_text = transcribe_and_respond(audio_path)

    record = VoiceQuery(
        farm_id=farm_id,
        audio_path=audio_path,
        transcribed_text=transcribed_text,
        language=language,
        response_text=response_text,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return VoiceQueryResponse(
        query_id=record.id,
        farm_id=record.farm_id,
        audio_path=record.audio_path,
        transcribed_text=record.transcribed_text,
        language=record.language,
        response_text=record.response_text,
        created_at=record.created_at,
    )


# ---------------------------------------------------------------------------
# #56 Multimodal Query
# ---------------------------------------------------------------------------
@router.post(
    "/multimodal-query",
    response_model=MultimodalQueryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def multimodal_query(
    farm_id: UUID = Form(...),
    input_text: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Fuse disease detection (from image) with keyword-matched text response."""
    farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    image_path: Optional[str] = None
    if image_file:
        upload_dir = os.path.join("backend", "media", "multimodal", str(farm_id))
        os.makedirs(upload_dir, exist_ok=True)
        filename = image_file.filename or f"img_{uuid.uuid4().hex[:8]}.jpg"
        image_path = os.path.join(upload_dir, filename)
        img_content = await image_file.read()
        with open(image_path, "wb") as f:
            f.write(img_content)

    combined_response = process_multimodal_query(image_path, input_text)

    record = MultimodalQuery(
        farm_id=farm_id,
        image_path=image_path,
        input_text=input_text,
        combined_response=combined_response,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return MultimodalQueryResponse(
        query_id=record.id,
        farm_id=record.farm_id,
        image_path=record.image_path,
        input_text=record.input_text,
        combined_response=record.combined_response,
        created_at=record.created_at,
    )


# ---------------------------------------------------------------------------
# #57 Federated Learning — trigger-round
# ---------------------------------------------------------------------------
@router.post(
    "/federated/trigger-round",
    response_model=FLTriggerResponse,
    status_code=status.HTTP_200_OK,
)
def trigger_federated_round(
    db: Session = Depends(get_db),
):
    """Run 5 rounds of FedAvg with 4 simulated farm clients (sklearn LR).

    This endpoint blocks until all 5 rounds complete (typically 2-5 seconds)
    and returns the real per-round and final accuracy.
    """
    aggregate_accuracy, round_accuracies, participating_ids = (
        run_federated_learning_round()
    )

    run = FLTrainingRun(
        round_number=5,  # total rounds completed
        participating_farms=participating_ids,
        aggregate_accuracy=aggregate_accuracy,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return FLTriggerResponse(
        run_id=run.id,
        rounds_completed=5,
        participating_farm_count=len(participating_ids),
        round_accuracies=round_accuracies,
        aggregate_accuracy=aggregate_accuracy,
        completed_at=run.completed_at,
    )


# ---------------------------------------------------------------------------
# #58 What-If Causal Simulation
# ---------------------------------------------------------------------------
@router.post(
    "/whatif-simulate",
    response_model=WhatIfResponse,
    status_code=status.HTTP_201_CREATED,
)
def whatif_simulate(
    payload: WhatIfRequest,
    db: Session = Depends(get_db),
):
    """Use DoWhy backdoor.linear_regression to estimate yield/profit delta."""
    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    yield_delta, profit_delta, explanation, projected_delta = run_whatif_simulation(
        payload.current_decision,
        payload.proposed_change,
    )

    sim = CausalSimulation(
        farm_id=payload.farm_id,
        current_decision=payload.current_decision,
        proposed_change=payload.proposed_change,
        projected_delta=projected_delta,
        explanation=explanation,
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)

    return WhatIfResponse(
        simulation_id=sim.id,
        farm_id=sim.farm_id,
        causal_estimate=projected_delta.get("causal_estimate_value", yield_delta),
        naive_correlation_estimate=projected_delta.get("naive_correlation_estimate", 0.0),
        confounding_bias_kg_ha=projected_delta.get("confounding_bias_kg_ha", 0.0),
        projected_yield_delta_kg_ha=yield_delta,
        projected_profit_delta_inr_ha=profit_delta,
        explanation=explanation,
        projected_delta=projected_delta,
        created_at=sim.created_at,
    )
