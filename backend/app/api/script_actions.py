from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_session
from backend.app.models.script_action import ScriptAction
from backend.app.schemas.script_action import (
    ScriptActionCreate,
    ScriptActionRead,
    ScriptActionUpdate,
)

router = APIRouter(prefix="/api/script-actions", tags=["script-actions"])


@router.post("/", response_model=ScriptActionRead, status_code=201)
async def create_script_action(
    data: ScriptActionCreate, session: AsyncSession = Depends(get_session)
):
    action = ScriptAction(
        name=data.name,
        description=data.description,
        script=data.script,
        param_schema=data.param_schema,
    )
    session.add(action)
    await session.commit()
    await session.refresh(action)
    return action


@router.get("/", response_model=list[ScriptActionRead])
async def list_script_actions(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(ScriptAction).order_by(ScriptAction.name.asc()))
    return result.scalars().all()


@router.get("/{action_id}", response_model=ScriptActionRead)
async def get_script_action(action_id: int, session: AsyncSession = Depends(get_session)):
    action = await session.get(ScriptAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Script action not found")
    return action


@router.patch("/{action_id}", response_model=ScriptActionRead)
async def update_script_action(
    action_id: int,
    data: ScriptActionUpdate,
    session: AsyncSession = Depends(get_session),
):
    action = await session.get(ScriptAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Script action not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(action, key, value)

    await session.commit()
    await session.refresh(action)
    return action


@router.delete("/{action_id}", status_code=204)
async def delete_script_action(action_id: int, session: AsyncSession = Depends(get_session)):
    action = await session.get(ScriptAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Script action not found")
    await session.delete(action)
    await session.commit()
