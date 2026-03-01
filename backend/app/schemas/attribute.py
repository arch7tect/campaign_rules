from datetime import datetime

from pydantic import BaseModel, field_validator

from backend.app.models.attribute import DataType, OwnerType


class AttributeConstraints(BaseModel):
    required: bool = False
    default: str | int | float | bool | None = None
    enum_values: list[str] | None = None
    validation_regex: str | None = None
    min_value: float | None = None
    max_value: float | None = None
    min_length: int | None = None
    max_length: int | None = None


class AttributeDefinitionCreate(BaseModel):
    name: str
    display_name: str
    data_type: DataType
    owner_type: OwnerType
    campaign_id: int | None = None
    constraints: AttributeConstraints | None = None
    is_fixed: bool = False


class AttributeDefinitionUpdate(BaseModel):
    display_name: str | None = None
    constraints: AttributeConstraints | None = None


class AttributeDefinitionRead(BaseModel):
    id: int
    name: str
    display_name: str
    data_type: DataType
    owner_type: OwnerType
    campaign_id: int | None = None
    constraints: AttributeConstraints | None = None
    is_fixed: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("constraints", mode="before")
    @classmethod
    def parse_constraints(cls, v):
        if isinstance(v, dict):
            return AttributeConstraints(**v)
        return v
