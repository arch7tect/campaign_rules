from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_session
from backend.app.models.communication import CommunicationStatus, ScheduledCommunication
from backend.app.schemas.communication import ScheduledCommunicationRead

router = APIRouter(prefix="/api/communications", tags=["communications"])


@router.get("/", response_model=list[ScheduledCommunicationRead])
async def list_communications(
    campaign_id: int | None = None,
    contact_id: int | None = None,
    status: CommunicationStatus | None = None,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
):
    query = select(ScheduledCommunication)
    if campaign_id is not None:
        query = query.where(ScheduledCommunication.campaign_id == campaign_id)
    if contact_id is not None:
        query = query.where(ScheduledCommunication.contact_id == contact_id)
    if status is not None:
        query = query.where(ScheduledCommunication.status == status)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/{comm_id}/cancel", response_model=ScheduledCommunicationRead)
async def cancel_communication(
    comm_id: int, session: AsyncSession = Depends(get_session)
):
    comm = await session.get(ScheduledCommunication, comm_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")
    if comm.status != CommunicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending communications can be cancelled")
    comm.status = CommunicationStatus.CANCELLED
    await session.commit()
    await session.refresh(comm)
    return comm
