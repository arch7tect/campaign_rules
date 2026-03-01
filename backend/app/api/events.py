from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_session
from backend.app.schemas.events import EventPayload
from backend.app.services.event_service import dispatch_event

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("/", status_code=200)
async def fire_event(
    payload: EventPayload, session: AsyncSession = Depends(get_session)
):
    try:
        await dispatch_event(payload, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "ok", "event_type": payload.event_type}
