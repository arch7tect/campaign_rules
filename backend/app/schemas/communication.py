from datetime import datetime

from pydantic import BaseModel

from backend.app.models.communication import CommunicationStatus


class ScheduledCommunicationCreate(BaseModel):
    contact_id: int
    campaign_id: int
    campaign_member_id: int
    channel: str
    agent_params: dict | None = None
    min_time: datetime | None = None
    max_time: datetime | None = None


class ScheduledCommunicationRead(BaseModel):
    id: int
    contact_id: int
    campaign_id: int
    campaign_member_id: int
    channel: str
    agent_params: dict | None = None
    min_time: datetime | None = None
    max_time: datetime | None = None
    status: CommunicationStatus
    created_at: datetime

    model_config = {"from_attributes": True}
