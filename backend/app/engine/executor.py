"""Graph executor — traverses rule graph on event arrival."""

import logging
from collections import defaultdict
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from backend.app.engine.actions import (
    execute_cancel_communications,
    execute_modify_model,
    execute_run_script,
    execute_schedule_communication,
    execute_trigger_event,
)
from backend.app.engine.conditions import evaluate_variable_check
from backend.app.engine.context import ExecutionContext
from backend.app.models.rule import NodeType, Rule, RuleEdge, RuleNode
from backend.app.schemas.rule import (
    CancelCommunicationsActionConfig,
    ModifyModelActionConfig,
    RunScriptActionConfig,
    ScheduleCommunicationActionConfig,
    TriggerEventActionConfig,
    VariableCheckConditionConfig,
)

logger = logging.getLogger(__name__)

MAX_DEPTH = 50


class RuleExecutor:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute_event(
        self,
        campaign_id: int,
        event_type: str,
        ctx: ExecutionContext,
        event_name: str | None = None,
        depth: int = 0,
    ) -> None:
        if depth > MAX_DEPTH:
            logger.warning("Max execution depth reached, stopping.")
            return

        # Load all active rules for this campaign
        result = await self.session.execute(
            select(Rule)
            .where(Rule.campaign_id == campaign_id, Rule.is_active.is_(True))
            .options(selectinload(Rule.nodes), selectinload(Rule.edges))
        )
        rules = result.scalars().unique().all()

        for rule in rules:
            await self._execute_rule(rule, event_type, event_name, ctx, depth)

    async def _execute_rule(
        self,
        rule: Rule,
        event_type: str,
        event_name: str | None,
        ctx: ExecutionContext,
        depth: int,
    ) -> None:
        # Build adjacency: source_node_id + source_port -> list of target nodes
        edges_by_source: dict[tuple[int, str], list[RuleEdge]] = defaultdict(list)
        for edge in rule.edges:
            edges_by_source[(edge.source_node_id, edge.source_port)].append(edge)

        nodes_by_id = {node.id: node for node in rule.nodes}

        # Find matching event nodes
        event_nodes = [
            n for n in rule.nodes
            if n.node_type == NodeType.EVENT and self._matches_event(n, event_type, event_name)
        ]

        for event_node in event_nodes:
            visited: set[int] = set()
            await self._traverse(
                event_node, "default", edges_by_source, nodes_by_id, ctx, depth, visited
            )

    def _matches_event(
        self, node: RuleNode, event_type: str, event_name: str | None
    ) -> bool:
        config = node.config or {}
        node_event_type = config.get("event_type", node.node_subtype)
        if node_event_type != event_type:
            return False
        if event_type == "custom":
            return config.get("event_name") == event_name
        return True

    async def _traverse(
        self,
        node: RuleNode,
        output_port: str,
        edges_by_source: dict[tuple[int, str], list[RuleEdge]],
        nodes_by_id: dict[int, RuleNode],
        ctx: ExecutionContext,
        depth: int,
        visited: set[int],
    ) -> None:
        # Follow edges from this node's output port
        outgoing = edges_by_source.get((node.id, output_port), [])
        for edge in outgoing:
            target = nodes_by_id.get(edge.target_node_id)
            if target is None:
                continue

            # Simple cycle guard per traversal path
            if target.id in visited:
                logger.warning(f"Cycle detected at node {target.id}, skipping.")
                continue
            visited.add(target.id)

            await self._execute_node(target, edges_by_source, nodes_by_id, ctx, depth, visited)

    async def _execute_node(
        self,
        node: RuleNode,
        edges_by_source: dict[tuple[int, str], list[RuleEdge]],
        nodes_by_id: dict[int, RuleNode],
        ctx: ExecutionContext,
        depth: int,
        visited: set[int],
    ) -> None:
        config = node.config or {}

        if node.node_type == NodeType.CONDITION:
            output_port = await self._evaluate_condition(node, config, ctx)
            if output_port:
                await self._traverse(node, output_port, edges_by_source, nodes_by_id, ctx, depth, visited)

        elif node.node_type == NodeType.ACTION:
            triggered_event = await self._execute_action(node, config, ctx)
            # Continue traversal from action's default port
            await self._traverse(node, "default", edges_by_source, nodes_by_id, ctx, depth, visited)
            # Handle triggered events
            if triggered_event:
                await self.execute_event(
                    ctx.campaign_member.campaign_id,
                    "custom",
                    ctx,
                    event_name=triggered_event,
                    depth=depth + 1,
                )

    async def _evaluate_condition(
        self, node: RuleNode, config: dict, ctx: ExecutionContext
    ) -> str | None:
        if node.node_subtype == "variable_check":
            parsed = VariableCheckConditionConfig(**config)
            return evaluate_variable_check(parsed, ctx)
        logger.warning(f"Unknown condition subtype: {node.node_subtype}")
        return None

    async def _execute_action(
        self, node: RuleNode, config: dict, ctx: ExecutionContext
    ) -> str | None:
        match node.node_subtype:
            case "modify_model":
                parsed = ModifyModelActionConfig(**config)
                await execute_modify_model(parsed, ctx)
            case "cancel_communications":
                parsed = CancelCommunicationsActionConfig(**config)
                await execute_cancel_communications(parsed, ctx)
            case "schedule_communication":
                parsed = ScheduleCommunicationActionConfig(**config)
                await execute_schedule_communication(parsed, ctx)
            case "run_script":
                parsed = RunScriptActionConfig(**config)
                await execute_run_script(parsed, ctx)
            case "trigger_event":
                parsed = TriggerEventActionConfig(**config)
                return await execute_trigger_event(parsed, ctx)
            case _:
                logger.warning(f"Unknown action subtype: {node.node_subtype}")
        return None
