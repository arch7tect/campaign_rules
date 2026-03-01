from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field


# --- Event configs ---

class EventType(str, Enum):
    MEMBER_ADDED = "member_added"
    CONTACT_UPDATED = "contact_updated"
    CONVERSATION_ENDED = "conversation_ended"
    CONVERSATION_UPDATED = "conversation_updated"
    CUSTOM = "custom"


class MemberAddedEventConfig(BaseModel):
    event_type: Literal["member_added"] = "member_added"


class ContactUpdatedEventConfig(BaseModel):
    event_type: Literal["contact_updated"] = "contact_updated"


class ConversationEndedEventConfig(BaseModel):
    event_type: Literal["conversation_ended"] = "conversation_ended"


class ConversationUpdatedEventConfig(BaseModel):
    event_type: Literal["conversation_updated"] = "conversation_updated"


class CustomEventConfig(BaseModel):
    event_type: Literal["custom"] = "custom"
    event_name: str


EventConfig = Annotated[
    MemberAddedEventConfig
    | ContactUpdatedEventConfig
    | ConversationEndedEventConfig
    | ConversationUpdatedEventConfig
    | CustomEventConfig,
    Field(discriminator="event_type"),
]


# --- Condition configs ---

class ComparisonOperator(str, Enum):
    EQ = "eq"
    NEQ = "neq"
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"
    IN = "in"
    NOT_IN = "not_in"
    MATCHES = "matches"


class ValueSource(str, Enum):
    CONSTANT = "constant"
    ATTRIBUTE = "attribute"
    EXPRESSION = "expression"


class ValueRef(BaseModel):
    source: ValueSource
    value: Any = None
    object_type: str | None = None  # "contact", "campaign_member", "conversation_results"
    attribute_name: str | None = None
    expression: str | None = None


class VariableCheck(BaseModel):
    left: ValueRef
    operator: ComparisonOperator
    right: ValueRef | None = None  # None for IS_NULL / IS_NOT_NULL
    port_name: str = "match"


class VariableCheckConditionConfig(BaseModel):
    condition_type: Literal["variable_check"] = "variable_check"
    checks: list[VariableCheck]
    has_else_port: bool = True


ConditionConfig = VariableCheckConditionConfig


# --- Action configs ---

class FieldAssignment(BaseModel):
    object_type: str  # "contact" or "campaign_member"
    attribute_name: str
    value: ValueRef


class ModifyModelActionConfig(BaseModel):
    action_type: Literal["modify_model"] = "modify_model"
    assignments: list[FieldAssignment]


class CancelCommunicationsActionConfig(BaseModel):
    action_type: Literal["cancel_communications"] = "cancel_communications"


class ScheduleCommunicationActionConfig(BaseModel):
    action_type: Literal["schedule_communication"] = "schedule_communication"
    channel: str
    agent_params: dict | None = None
    min_time_expr: str | None = None  # Python expression returning datetime
    max_time_expr: str | None = None


class RunScriptActionConfig(BaseModel):
    action_type: Literal["run_script"] = "run_script"
    script: str


class TriggerEventActionConfig(BaseModel):
    action_type: Literal["trigger_event"] = "trigger_event"
    event_name: str


ActionConfig = Annotated[
    ModifyModelActionConfig
    | CancelCommunicationsActionConfig
    | ScheduleCommunicationActionConfig
    | RunScriptActionConfig
    | TriggerEventActionConfig,
    Field(discriminator="action_type"),
]


# --- Node / Edge / Rule schemas ---

class NodeType(str, Enum):
    EVENT = "event"
    CONDITION = "condition"
    ACTION = "action"


class RuleNodeCreate(BaseModel):
    node_type: NodeType
    node_subtype: str
    config: dict = {}
    position_x: float = 0.0
    position_y: float = 0.0


class RuleNodeRead(BaseModel):
    id: int
    rule_id: int
    node_type: NodeType
    node_subtype: str
    config: dict | None = None
    position_x: float
    position_y: float

    model_config = {"from_attributes": True}


class RuleEdgeCreate(BaseModel):
    source_node_id: int
    source_port: str = "default"
    target_node_id: int
    target_port: str = "default"
    label: str | None = None


class RuleEdgeRead(BaseModel):
    id: int
    rule_id: int
    source_node_id: int
    source_port: str
    target_node_id: int
    target_port: str
    label: str | None = None

    model_config = {"from_attributes": True}


class RuleCreate(BaseModel):
    campaign_id: int
    name: str
    description: str | None = None
    is_active: bool = True
    nodes: list[RuleNodeCreate] = []
    edges: list[RuleEdgeCreate] = []


class RuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class RuleRead(BaseModel):
    id: int
    campaign_id: int
    name: str
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    nodes: list[RuleNodeRead] = []
    edges: list[RuleEdgeRead] = []

    model_config = {"from_attributes": True}


class RuleGraphUpdate(BaseModel):
    """Full graph replacement — nodes and edges."""
    nodes: list[RuleNodeCreate]
    edges: list[RuleEdgeCreate]
