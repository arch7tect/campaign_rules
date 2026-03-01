from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_session
from backend.app.models.attribute import AttributeDefinition, OwnerType
from backend.app.models.contact import ContactInfo
from backend.app.schemas.contact import ContactCreate, ContactRead, ContactUpdate
from backend.app.services.attribute_validator import (
    AttributeValidationError,
    validate_attributes,
)

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


async def _validate_contact_attrs(
    attrs: dict | None, session: AsyncSession
) -> dict | None:
    if not attrs:
        return attrs
    result = await session.execute(
        select(AttributeDefinition).where(
            AttributeDefinition.owner_type == OwnerType.CONTACT,
            AttributeDefinition.campaign_id.is_(None),
        )
    )
    definitions = list(result.scalars().all())
    if not definitions:
        return attrs
    try:
        return validate_attributes(attrs, definitions)
    except AttributeValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors)


@router.post("/", response_model=ContactRead, status_code=201)
async def create_contact(
    data: ContactCreate, session: AsyncSession = Depends(get_session)
):
    attrs = await _validate_contact_attrs(data.attributes, session)
    contact = ContactInfo(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        attributes=attrs or {},
    )
    session.add(contact)
    await session.commit()
    await session.refresh(contact)
    return contact


@router.get("/", response_model=list[ContactRead])
async def list_contacts(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(ContactInfo).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{contact_id}", response_model=ContactRead)
async def get_contact(contact_id: int, session: AsyncSession = Depends(get_session)):
    contact = await session.get(ContactInfo, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactRead)
async def update_contact(
    contact_id: int,
    data: ContactUpdate,
    session: AsyncSession = Depends(get_session),
):
    contact = await session.get(ContactInfo, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    update_data = data.model_dump(exclude_unset=True)

    if "attributes" in update_data and update_data["attributes"] is not None:
        merged = {**(contact.attributes or {}), **update_data["attributes"]}
        update_data["attributes"] = await _validate_contact_attrs(merged, session)

    for key, value in update_data.items():
        setattr(contact, key, value)

    await session.commit()
    await session.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: int, session: AsyncSession = Depends(get_session)
):
    contact = await session.get(ContactInfo, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await session.delete(contact)
    await session.commit()
