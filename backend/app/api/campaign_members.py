from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_session
from backend.app.models.attribute import AttributeDefinition, OwnerType
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_member import CampaignMember
from backend.app.models.contact import ContactInfo
from backend.app.schemas.campaign_member import (
    CampaignMemberCreate,
    CampaignMemberRead,
    CampaignMemberUpdate,
)
from backend.app.schemas.events import EventPayload
from backend.app.services.event_service import dispatch_event
from backend.app.services.attribute_validator import (
    AttributeValidationError,
    validate_attributes,
)

router = APIRouter(prefix="/api/campaign-members", tags=["campaign_members"])


async def _validate_member_attrs(
    attrs: dict | None, campaign_id: int, session: AsyncSession
) -> dict | None:
    if not attrs:
        return attrs
    result = await session.execute(
        select(AttributeDefinition).where(
            AttributeDefinition.owner_type == OwnerType.CAMPAIGN_MEMBER,
            AttributeDefinition.campaign_id == campaign_id,
        )
    )
    definitions = list(result.scalars().all())
    if not definitions:
        return attrs
    try:
        return validate_attributes(attrs, definitions)
    except AttributeValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors)


@router.post("/", response_model=CampaignMemberRead, status_code=201)
async def create_campaign_member(
    data: CampaignMemberCreate, session: AsyncSession = Depends(get_session)
):
    # Verify contact and campaign exist
    contact = await session.get(ContactInfo, data.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    campaign = await session.get(Campaign, data.campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Prevent duplicate memberships for the same contact in a campaign.
    existing_result = await session.execute(
        select(CampaignMember).where(
            CampaignMember.contact_id == data.contact_id,
            CampaignMember.campaign_id == data.campaign_id,
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Contact is already a member of this campaign")

    attrs = await _validate_member_attrs(data.attributes, data.campaign_id, session)
    member = CampaignMember(
        contact_id=data.contact_id,
        campaign_id=data.campaign_id,
        attributes=attrs or {},
        status=data.status,
    )
    session.add(member)
    try:
        await session.flush()

        # Automatically fire member_added so onboarding rules execute immediately.
        await dispatch_event(
            EventPayload(
                event_type="member_added",
                campaign_id=data.campaign_id,
                contact_id=data.contact_id,
            ),
            session,
        )
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"member_added dispatch failed: {e}")

    await session.refresh(member)
    return member


@router.get("/", response_model=list[CampaignMemberRead])
async def list_campaign_members(
    campaign_id: int | None = None,
    contact_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
):
    query = select(CampaignMember)
    if campaign_id is not None:
        query = query.where(CampaignMember.campaign_id == campaign_id)
    if contact_id is not None:
        query = query.where(CampaignMember.contact_id == contact_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{member_id}", response_model=CampaignMemberRead)
async def get_campaign_member(
    member_id: int, session: AsyncSession = Depends(get_session)
):
    member = await session.get(CampaignMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Campaign member not found")
    return member


@router.patch("/{member_id}", response_model=CampaignMemberRead)
async def update_campaign_member(
    member_id: int,
    data: CampaignMemberUpdate,
    session: AsyncSession = Depends(get_session),
):
    member = await session.get(CampaignMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Campaign member not found")

    update_data = data.model_dump(exclude_unset=True)

    if "attributes" in update_data and update_data["attributes"] is not None:
        merged = {**(member.attributes or {}), **update_data["attributes"]}
        update_data["attributes"] = await _validate_member_attrs(
            merged, member.campaign_id, session
        )

    for key, value in update_data.items():
        setattr(member, key, value)

    await session.commit()
    await session.refresh(member)
    return member


@router.delete("/{member_id}", status_code=204)
async def delete_campaign_member(
    member_id: int, session: AsyncSession = Depends(get_session)
):
    member = await session.get(CampaignMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Campaign member not found")
    await session.delete(member)
    await session.commit()
