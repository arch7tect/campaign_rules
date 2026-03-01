import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models import Base


class NodeType(str, enum.Enum):
    EVENT = "event"
    CONDITION = "condition"
    ACTION = "action"


class Rule(Base):
    __tablename__ = "rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    campaign: Mapped["Campaign"] = relationship(back_populates="rules")  # noqa: F821
    nodes: Mapped[list["RuleNode"]] = relationship(
        back_populates="rule", cascade="all, delete-orphan"
    )
    edges: Mapped[list["RuleEdge"]] = relationship(
        back_populates="rule", cascade="all, delete-orphan"
    )


class RuleNode(Base):
    __tablename__ = "rule_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rule_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rules.id", ondelete="CASCADE"), nullable=False
    )
    node_type: Mapped[NodeType] = mapped_column(Enum(NodeType), nullable=False)
    node_subtype: Mapped[str] = mapped_column(String(100), nullable=False)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)
    position_x: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    position_y: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    rule: Mapped["Rule"] = relationship(back_populates="nodes")


class RuleEdge(Base):
    __tablename__ = "rule_edges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rule_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rules.id", ondelete="CASCADE"), nullable=False
    )
    source_node_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rule_nodes.id", ondelete="CASCADE"), nullable=False
    )
    source_port: Mapped[str] = mapped_column(String(100), default="default", nullable=False)
    target_node_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rule_nodes.id", ondelete="CASCADE"), nullable=False
    )
    target_port: Mapped[str] = mapped_column(String(100), default="default", nullable=False)

    rule: Mapped["Rule"] = relationship(back_populates="edges")
    source_node: Mapped["RuleNode"] = relationship(foreign_keys=[source_node_id])
    target_node: Mapped["RuleNode"] = relationship(foreign_keys=[target_node_id])
