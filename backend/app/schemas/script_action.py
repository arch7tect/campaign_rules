from datetime import datetime

from pydantic import BaseModel


class ScriptActionCreate(BaseModel):
    name: str
    description: str | None = None
    script: str
    param_schema: dict | None = None


class ScriptActionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    script: str | None = None
    param_schema: dict | None = None


class ScriptActionRead(BaseModel):
    id: int
    name: str
    description: str | None = None
    script: str
    param_schema: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
