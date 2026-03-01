from datetime import datetime

from pydantic import BaseModel

from backend.app.models.campaign import CampaignStatus


class CampaignCreate(BaseModel):
    name: str
    description: str | None = None
    status: CampaignStatus = CampaignStatus.DRAFT


class CampaignUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: CampaignStatus | None = None


class CampaignRead(BaseModel):
    id: int
    name: str
    description: str | None = None
    status: CampaignStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
