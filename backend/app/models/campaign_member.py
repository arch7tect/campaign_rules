import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models import Base


class MemberStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    REMOVED = "removed"
    COMPLETED = "completed"


class CampaignMember(Base):
    __tablename__ = "campaign_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contact_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False
    )
    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )
    attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)
    status: Mapped[MemberStatus] = mapped_column(
        Enum(MemberStatus), default=MemberStatus.ACTIVE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    contact: Mapped["ContactInfo"] = relationship(back_populates="memberships")  # noqa: F821
    campaign: Mapped["Campaign"] = relationship(back_populates="members")  # noqa: F821
