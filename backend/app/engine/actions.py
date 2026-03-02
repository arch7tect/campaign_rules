"""Action executors for rule engine."""

import logging
from datetime import datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.engine.context import ExecutionContext
from backend.app.engine.scripting import safe_eval, safe_exec
from backend.app.models.communication import CommunicationStatus, ScheduledCommunication
from backend.app.models.script_action import ScriptAction
from backend.app.schemas.rule import (
    CancelCommunicationsActionConfig,
    FieldAssignment,
    ModifyModelActionConfig,
    RunScriptActionConfig,
    ScheduleCommunicationActionConfig,
    TriggerEventActionConfig,
    ValueRef,
    ValueSource,
)

logger = logging.getLogger(__name__)


def _resolve_value(ref: ValueRef, ctx: ExecutionContext) -> Any:
    from backend.app.engine.conditions import resolve_value
    return resolve_value(ref, ctx)


async def execute_modify_model(
    config: ModifyModelActionConfig, ctx: ExecutionContext
) -> None:
    for assignment in config.assignments:
        value = _resolve_value(assignment.value, ctx)
        ctx.set(assignment.object_type, assignment.attribute_name, value)


async def execute_cancel_communications(
    config: CancelCommunicationsActionConfig, ctx: ExecutionContext
) -> None:
    await ctx.session.execute(
        update(ScheduledCommunication)
        .where(
            ScheduledCommunication.contact_id == ctx.contact.id,
            ScheduledCommunication.campaign_id == ctx.campaign_member.campaign_id,
            ScheduledCommunication.status == CommunicationStatus.PENDING,
        )
        .values(status=CommunicationStatus.CANCELLED)
    )


async def execute_schedule_communication(
    config: ScheduleCommunicationActionConfig, ctx: ExecutionContext
) -> None:
    local_vars = ctx.to_locals()
    min_time = safe_eval(config.min_time_expr, local_vars) if config.min_time_expr else None
    max_time = safe_eval(config.max_time_expr, local_vars) if config.max_time_expr else None

    comm = ScheduledCommunication(
        contact_id=ctx.contact.id,
        campaign_id=ctx.campaign_member.campaign_id,
        campaign_member_id=ctx.campaign_member.id,
        channel=config.channel,
        agent_params=config.agent_params,
        min_time=min_time,
        max_time=max_time,
    )
    ctx.session.add(comm)


async def execute_run_script(
    config: RunScriptActionConfig, ctx: ExecutionContext
) -> None:
    local_vars = ctx.to_locals()
    if config.script_action_id is not None:
        action = await ctx.session.get(ScriptAction, config.script_action_id)
        if not action:
            raise RuntimeError(f"Script action {config.script_action_id} not found")
        script = action.script
    elif config.script:
        script = config.script
    else:
        raise RuntimeError("run_script requires script_action_id or script")

    params = config.params or {}
    local_vars["params"] = params
    for key, value in params.items():
        local_vars[f"param_{key}"] = value

    result_ns = safe_exec(script, local_vars)
    # If script sets _result dict, apply modifications
    if "_result" in result_ns and isinstance(result_ns["_result"], dict):
        for key, value in result_ns["_result"].items():
            if "." in key:
                obj_type, attr_name = key.split(".", 1)
                ctx.set(obj_type, attr_name, value)


async def execute_trigger_event(
    config: TriggerEventActionConfig, ctx: ExecutionContext
) -> str:
    """Returns the event name to be triggered by the executor."""
    return config.event_name
