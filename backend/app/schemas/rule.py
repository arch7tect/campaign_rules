from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, model_validator


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

    @model_validator(mode="after")
    def validate_expression_side(self):
        if self.left.source == ValueSource.EXPRESSION:
            raise ValueError("Expression source is only allowed on the right side.")
        return self


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
    script_action_id: int | None = None
    params: dict | None = None
    script: str | None = None  # Backward compatibility for existing inline scripts.

    @model_validator(mode="after")
    def validate_action_reference(self):
        if self.script_action_id is None and not self.script:
            raise ValueError("run_script requires script_action_id or script.")
        return self


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

    @model_validator(mode="after")
    def validate_event_fan_in(self):
        _validate_event_starts(self.nodes, self.edges)
        return self


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

    @model_validator(mode="after")
    def validate_event_fan_in(self):
        _validate_event_starts(self.nodes, self.edges)
        return self


def _validate_event_starts(nodes: list[RuleNodeCreate], edges: list[RuleEdgeCreate]) -> None:
    event_indices = [i for i, node in enumerate(nodes) if node.node_type == NodeType.EVENT]
    if len(event_indices) <= 1:
        return

    event_index_set = set(event_indices)
    outgoing_targets: dict[int, list[int]] = {idx: [] for idx in event_indices}

    for edge in edges:
        if edge.source_node_id in event_index_set:
            outgoing_targets[edge.source_node_id].append(edge.target_node_id)

    for event_idx, targets in outgoing_targets.items():
        if len(targets) != 1:
            raise ValueError(
                f"Each event node must have exactly one outgoing edge when multiple event nodes exist (event index {event_idx})."
            )

    target_set = {targets[0] for targets in outgoing_targets.values()}
    if len(target_set) != 1:
        raise ValueError(
            "All event nodes must connect to the same condition/action start node."
        )

    start_idx = next(iter(target_set))
    if not (0 <= start_idx < len(nodes)):
        raise ValueError("Event edge target references an invalid node index.")

    if nodes[start_idx].node_type == NodeType.EVENT:
        raise ValueError("Event nodes must connect to a condition or action node, not another event.")
