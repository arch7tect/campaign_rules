from pydantic import BaseModel


class EventPayload(BaseModel):
    event_type: str
    campaign_id: int
    contact_id: int
    event_name: str | None = None  # for custom events
    conversation_results: dict | None = None  # for conversation events
