from datetime import datetime

from pydantic import BaseModel

from backend.app.models.campaign_member import MemberStatus


class CampaignMemberCreate(BaseModel):
    contact_id: int
    campaign_id: int
    attributes: dict | None = None
    status: MemberStatus = MemberStatus.ACTIVE


class CampaignMemberUpdate(BaseModel):
    attributes: dict | None = None
    status: MemberStatus | None = None


class CampaignMemberRead(BaseModel):
    id: int
    contact_id: int
    campaign_id: int
    attributes: dict | None = None
    status: MemberStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
