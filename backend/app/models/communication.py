import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models import Base


class CommunicationStatus(str, enum.Enum):
    PENDING = "pending"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ScheduledCommunication(Base):
    __tablename__ = "scheduled_communications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contact_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False
    )
    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )
    campaign_member_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaign_members.id", ondelete="CASCADE"), nullable=False
    )
    channel: Mapped[str] = mapped_column(String(100), nullable=False)
    agent_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    min_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    max_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[CommunicationStatus] = mapped_column(
        Enum(CommunicationStatus), default=CommunicationStatus.PENDING, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    contact: Mapped["ContactInfo"] = relationship()  # noqa: F821
    campaign: Mapped["Campaign"] = relationship()  # noqa: F821
    campaign_member: Mapped["CampaignMember"] = relationship()  # noqa: F821
