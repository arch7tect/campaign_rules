from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_session
from backend.app.models.attribute import AttributeDefinition, OwnerType
from backend.app.schemas.attribute import (
    AttributeDefinitionCreate,
    AttributeDefinitionRead,
    AttributeDefinitionUpdate,
)

router = APIRouter(prefix="/api/attributes", tags=["attributes"])


@router.post("/", response_model=AttributeDefinitionRead, status_code=201)
async def create_attribute(
    data: AttributeDefinitionCreate, session: AsyncSession = Depends(get_session)
):
    attr = AttributeDefinition(
        name=data.name,
        display_name=data.display_name,
        data_type=data.data_type,
        owner_type=data.owner_type,
        campaign_id=data.campaign_id,
        constraints=data.constraints.model_dump() if data.constraints else None,
        is_fixed=data.is_fixed,
    )
    session.add(attr)
    await session.commit()
    await session.refresh(attr)
    return attr


@router.get("/", response_model=list[AttributeDefinitionRead])
async def list_attributes(
    owner_type: OwnerType | None = None,
    campaign_id: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(AttributeDefinition)
    if owner_type is not None:
        query = query.where(AttributeDefinition.owner_type == owner_type)
    if campaign_id is not None:
        query = query.where(AttributeDefinition.campaign_id == campaign_id)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{attr_id}", response_model=AttributeDefinitionRead)
async def get_attribute(
    attr_id: int, session: AsyncSession = Depends(get_session)
):
    attr = await session.get(AttributeDefinition, attr_id)
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute definition not found")
    return attr


@router.patch("/{attr_id}", response_model=AttributeDefinitionRead)
async def update_attribute(
    attr_id: int,
    data: AttributeDefinitionUpdate,
    session: AsyncSession = Depends(get_session),
):
    attr = await session.get(AttributeDefinition, attr_id)
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute definition not found")
    update_data = data.model_dump(exclude_unset=True)
    if "constraints" in update_data and update_data["constraints"] is not None:
        update_data["constraints"] = update_data["constraints"].model_dump() if hasattr(update_data["constraints"], "model_dump") else update_data["constraints"]
    for key, value in update_data.items():
        setattr(attr, key, value)
    await session.commit()
    await session.refresh(attr)
    return attr


@router.delete("/{attr_id}", status_code=204)
async def delete_attribute(
    attr_id: int, session: AsyncSession = Depends(get_session)
):
    attr = await session.get(AttributeDefinition, attr_id)
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute definition not found")
    await session.delete(attr)
    await session.commit()
