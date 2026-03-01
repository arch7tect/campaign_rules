from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_session
from backend.app.models.campaign import Campaign
from backend.app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.post("/", response_model=CampaignRead, status_code=201)
async def create_campaign(
    data: CampaignCreate, session: AsyncSession = Depends(get_session)
):
    campaign = Campaign(**data.model_dump())
    session.add(campaign)
    await session.commit()
    await session.refresh(campaign)
    return campaign


@router.get("/", response_model=list[CampaignRead])
async def list_campaigns(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Campaign).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{campaign_id}", response_model=CampaignRead)
async def get_campaign(
    campaign_id: int, session: AsyncSession = Depends(get_session)
):
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.patch("/{campaign_id}", response_model=CampaignRead)
async def update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    session: AsyncSession = Depends(get_session),
):
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(campaign, key, value)
    await session.commit()
    await session.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}", status_code=204)
async def delete_campaign(
    campaign_id: int, session: AsyncSession = Depends(get_session)
):
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await session.delete(campaign)
    await session.commit()
