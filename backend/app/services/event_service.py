"""Event dispatch — receives events and invokes the rule engine."""

import logging

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.engine.context import ExecutionContext
from backend.app.engine.executor import RuleExecutor
from backend.app.models.campaign_member import CampaignMember
from backend.app.models.contact import ContactInfo
from backend.app.schemas.events import EventPayload

logger = logging.getLogger(__name__)


async def dispatch_event(payload: EventPayload, session: AsyncSession) -> None:
    """Dispatch an event to all active rules in the campaign."""
    contact = await session.get(ContactInfo, payload.contact_id)
    if not contact:
        raise ValueError(f"Contact {payload.contact_id} not found")

    # Find campaign member
    result = await session.execute(
        select(CampaignMember).where(
            CampaignMember.contact_id == payload.contact_id,
            CampaignMember.campaign_id == payload.campaign_id,
        ).order_by(desc(CampaignMember.id)).limit(1)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise ValueError(
            f"Contact {payload.contact_id} is not a member of campaign {payload.campaign_id}"
        )

    ctx = ExecutionContext(
        session=session,
        contact=contact,
        campaign_member=member,
        conversation_results=payload.conversation_results,
    )

    executor = RuleExecutor(session)
    await executor.execute_event(
        campaign_id=payload.campaign_id,
        event_type=payload.event_type,
        ctx=ctx,
        event_name=payload.event_name,
    )

    # Commit any changes made by actions
    await session.commit()
