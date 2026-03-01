import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.models import Base


class DataType(str, enum.Enum):
    STRING = "string"
    INT = "int"
    FLOAT = "float"
    BOOL = "bool"
    DATE = "date"
    DATETIME = "datetime"
    ENUM = "enum"
    LIST = "list"
    PHONE = "phone"
    EMAIL = "email"
    URL = "url"


class OwnerType(str, enum.Enum):
    CONTACT = "contact"
    CAMPAIGN_MEMBER = "campaign_member"


class AttributeDefinition(Base):
    __tablename__ = "attribute_definitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    data_type: Mapped[DataType] = mapped_column(Enum(DataType), nullable=False)
    owner_type: Mapped[OwnerType] = mapped_column(Enum(OwnerType), nullable=False)
    campaign_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True
    )
    constraints: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_fixed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
