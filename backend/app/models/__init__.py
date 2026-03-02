from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from backend.app.models.attribute import AttributeDefinition  # noqa: E402, F401
from backend.app.models.campaign import Campaign  # noqa: E402, F401
from backend.app.models.campaign_member import CampaignMember  # noqa: E402, F401
from backend.app.models.communication import ScheduledCommunication  # noqa: E402, F401
from backend.app.models.contact import ContactInfo  # noqa: E402, F401
from backend.app.models.rule import Rule, RuleEdge, RuleNode  # noqa: E402, F401
from backend.app.models.script_action import ScriptAction  # noqa: E402, F401
