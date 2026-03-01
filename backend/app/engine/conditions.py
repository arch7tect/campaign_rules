"""Condition evaluators for rule engine."""

import re
from typing import Any

from backend.app.engine.context import ExecutionContext
from backend.app.engine.scripting import safe_eval
from backend.app.schemas.rule import (
    ComparisonOperator,
    ValueRef,
    ValueSource,
    VariableCheckConditionConfig,
)


def resolve_value(ref: ValueRef, ctx: ExecutionContext) -> Any:
    match ref.source:
        case ValueSource.CONSTANT:
            return ref.value
        case ValueSource.ATTRIBUTE:
            return ctx.get(ref.object_type, ref.attribute_name)
        case ValueSource.EXPRESSION:
            return safe_eval(ref.expression, ctx.to_locals())
    raise ValueError(f"Unknown value source: {ref.source}")


def compare(left: Any, operator: ComparisonOperator, right: Any) -> bool:
    match operator:
        case ComparisonOperator.EQ:
            return left == right
        case ComparisonOperator.NEQ:
            return left != right
        case ComparisonOperator.GT:
            return left > right
        case ComparisonOperator.GTE:
            return left >= right
        case ComparisonOperator.LT:
            return left < right
        case ComparisonOperator.LTE:
            return left <= right
        case ComparisonOperator.CONTAINS:
            return right in left if left is not None else False
        case ComparisonOperator.NOT_CONTAINS:
            return right not in left if left is not None else True
        case ComparisonOperator.STARTS_WITH:
            return str(left).startswith(str(right)) if left is not None else False
        case ComparisonOperator.ENDS_WITH:
            return str(left).endswith(str(right)) if left is not None else False
        case ComparisonOperator.IS_NULL:
            return left is None
        case ComparisonOperator.IS_NOT_NULL:
            return left is not None
        case ComparisonOperator.IN:
            return left in right if right is not None else False
        case ComparisonOperator.NOT_IN:
            return left not in right if right is not None else True
        case ComparisonOperator.MATCHES:
            return bool(re.search(str(right), str(left))) if left is not None else False
    raise ValueError(f"Unknown operator: {operator}")


def evaluate_variable_check(
    config: VariableCheckConditionConfig, ctx: ExecutionContext
) -> str | None:
    """Evaluate variable_check condition. Returns the port name of the first matching check, or 'else' / None."""
    for check in config.checks:
        left = resolve_value(check.left, ctx)
        right = resolve_value(check.right, ctx) if check.right else None
        if compare(left, check.operator, right):
            return check.port_name

    if config.has_else_port:
        return "else"
    return None
