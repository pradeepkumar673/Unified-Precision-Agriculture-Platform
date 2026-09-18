"""create persistent CEA telemetry tables

Revision ID: a7e9c1d2b3f4
Revises: 659d79810cec
Create Date: 2026-09-16
"""
from alembic import op
import sqlalchemy as sa

revision = "a7e9c1d2b3f4"
down_revision = "659d79810cec"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("sensor_readings", sa.Column("id", sa.Uuid(), primary_key=True), sa.Column("farm_id", sa.Uuid(), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False), sa.Column("device_id", sa.String(128), nullable=False), sa.Column("device_type", sa.String(128), nullable=False), sa.Column("readings", sa.JSON(), nullable=False), sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False), sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False))
    op.create_index("ix_sensor_readings_farm_id", "sensor_readings", ["farm_id"])
    op.create_index("ix_sensor_readings_device_id", "sensor_readings", ["device_id"])
    op.create_index("ix_sensor_readings_device_type", "sensor_readings", ["device_type"])
    op.create_index("ix_sensor_readings_observed_at", "sensor_readings", ["observed_at"])
    op.create_table("cea_setpoints", sa.Column("id", sa.Uuid(), primary_key=True), sa.Column("farm_id", sa.Uuid(), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False), sa.Column("values", sa.JSON(), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False))
    op.create_index("ix_cea_setpoints_farm_id", "cea_setpoints", ["farm_id"])
    op.create_table("actuator_commands", sa.Column("id", sa.Uuid(), primary_key=True), sa.Column("farm_id", sa.Uuid(), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False), sa.Column("device_id", sa.String(128), nullable=False), sa.Column("command", sa.JSON(), nullable=False), sa.Column("reason", sa.String(500), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False))
    op.create_index("ix_actuator_commands_farm_id", "actuator_commands", ["farm_id"])
    op.create_index("ix_actuator_commands_device_id", "actuator_commands", ["device_id"])
    op.create_table("traceability_batches", sa.Column("id", sa.Uuid(), primary_key=True), sa.Column("farm_id", sa.Uuid(), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False), sa.Column("batch_id", sa.String(128), nullable=False, unique=True), sa.Column("crop", sa.String(128), nullable=False), sa.Column("sown_date", sa.DateTime(timezone=True), nullable=False), sa.Column("harvest_date", sa.DateTime(timezone=True), nullable=False), sa.Column("quality_grade", sa.String(32), nullable=False), sa.Column("metadata_json", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False))
    op.create_index("ix_traceability_batches_farm_id", "traceability_batches", ["farm_id"])
    op.create_index("ix_traceability_batches_batch_id", "traceability_batches", ["batch_id"])


def downgrade() -> None:
    op.drop_table("traceability_batches")
    op.drop_table("actuator_commands")
    op.drop_table("cea_setpoints")
    op.drop_table("sensor_readings")
