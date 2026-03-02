"""Execution context — provides attribute access for contact, campaign_member, conversation_results."""

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.campaign_member import CampaignMember
from backend.app.models.contact import ContactInfo


FIXED_CONTACT_FIELDS = {"first_name", "last_name", "email", "phone"}


class ExecutionContext:
    """Wraps contact, campaign_member, and conversation_results for rule execution."""

    def __init__(
        self,
        session: AsyncSession,
        contact: ContactInfo,
        campaign_member: CampaignMember,
        conversation_results: dict[str, Any] | None = None,
    ):
        self.session = session
        self.contact = contact
        self.campaign_member = campaign_member
        self.conversation_results = conversation_results or {}
        self._modified = False

    def get(self, object_type: str, attribute_name: str) -> Any:
        if object_type == "contact":
            if attribute_name in FIXED_CONTACT_FIELDS:
                return getattr(self.contact, attribute_name)
            return (self.contact.attributes or {}).get(attribute_name)
        elif object_type == "campaign_member":
            if attribute_name == "status":
                return self.campaign_member.status.value
            return (self.campaign_member.attributes or {}).get(attribute_name)
        elif object_type == "conversation_results":
            return self.conversation_results.get(attribute_name)
        raise ValueError(f"Unknown object_type: {object_type}")

    def set(self, object_type: str, attribute_name: str, value: Any) -> None:
        self._modified = True
        if object_type == "contact":
            if attribute_name in FIXED_CONTACT_FIELDS:
                setattr(self.contact, attribute_name, value)
            else:
                attrs = dict(self.contact.attributes or {})
                attrs[attribute_name] = value
                self.contact.attributes = attrs
        elif object_type == "campaign_member":
            attrs = dict(self.campaign_member.attributes or {})
            attrs[attribute_name] = value
            self.campaign_member.attributes = attrs
        else:
            raise ValueError(f"Cannot set on object_type: {object_type}")

    def to_locals(self) -> dict[str, Any]:
        """Build a dict of locals for script execution."""
        result: dict[str, Any] = {}
        # Contact fields
        for f in FIXED_CONTACT_FIELDS:
            result[f"contact_{f}"] = getattr(self.contact, f)
        for k, v in (self.contact.attributes or {}).items():
            result[f"contact_{k}"] = v

        # Campaign member fields
        result["member_status"] = self.campaign_member.status.value
        for k, v in (self.campaign_member.attributes or {}).items():
            result[f"member_{k}"] = v

        # Conversation results
        for k, v in self.conversation_results.items():
            result[f"conv_{k}"] = v

        # Provide context object for direct access
        result["context"] = self
        # Common datetime helpers for expression/script fields
        result["datetime"] = datetime
        result["timedelta"] = timedelta
        return result

    @property
    def modified(self) -> bool:
        return self._modified
