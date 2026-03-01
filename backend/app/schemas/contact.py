from datetime import datetime

from pydantic import BaseModel


class ContactCreate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    attributes: dict | None = None


class ContactUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    attributes: dict | None = None


class ContactRead(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    attributes: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
