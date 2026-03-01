from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.database import get_session
from backend.app.models.rule import Rule, RuleEdge, RuleNode
from backend.app.schemas.rule import (
    RuleCreate,
    RuleGraphUpdate,
    RuleRead,
    RuleUpdate,
)

router = APIRouter(prefix="/api/rules", tags=["rules"])


def _load_rule_options():
    return [selectinload(Rule.nodes), selectinload(Rule.edges)]


@router.post("/", response_model=RuleRead, status_code=201)
async def create_rule(
    data: RuleCreate, session: AsyncSession = Depends(get_session)
):
    rule = Rule(
        campaign_id=data.campaign_id,
        name=data.name,
        description=data.description,
        is_active=data.is_active,
    )
    session.add(rule)
    await session.flush()

    # Create a temp id map for edge resolution
    node_map: dict[int, RuleNode] = {}
    for i, node_data in enumerate(data.nodes):
        node = RuleNode(
            rule_id=rule.id,
            node_type=node_data.node_type,
            node_subtype=node_data.node_subtype,
            config=node_data.config,
            position_x=node_data.position_x,
            position_y=node_data.position_y,
        )
        session.add(node)
        node_map[i] = node

    await session.flush()

    for edge_data in data.edges:
        edge = RuleEdge(
            rule_id=rule.id,
            source_node_id=node_map[edge_data.source_node_id].id,
            source_port=edge_data.source_port,
            target_node_id=node_map[edge_data.target_node_id].id,
            target_port=edge_data.target_port,
        )
        session.add(edge)

    await session.commit()

    result = await session.execute(
        select(Rule).where(Rule.id == rule.id).options(*_load_rule_options())
    )
    return result.scalar_one()


@router.get("/", response_model=list[RuleRead])
async def list_rules(
    campaign_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
):
    query = select(Rule).options(*_load_rule_options())
    if campaign_id is not None:
        query = query.where(Rule.campaign_id == campaign_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().unique().all()


@router.get("/{rule_id}", response_model=RuleRead)
async def get_rule(rule_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Rule).where(Rule.id == rule_id).options(*_load_rule_options())
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.patch("/{rule_id}", response_model=RuleRead)
async def update_rule(
    rule_id: int,
    data: RuleUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Rule).where(Rule.id == rule_id).options(*_load_rule_options())
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)

    await session.commit()
    await session.refresh(rule)
    return rule


@router.put("/{rule_id}/graph", response_model=RuleRead)
async def update_rule_graph(
    rule_id: int,
    data: RuleGraphUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Replace all nodes and edges for a rule."""
    result = await session.execute(
        select(Rule).where(Rule.id == rule_id).options(*_load_rule_options())
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Delete existing nodes and edges
    for edge in rule.edges:
        await session.delete(edge)
    for node in rule.nodes:
        await session.delete(node)
    await session.flush()

    # Create new nodes
    temp_to_real: dict[int, int] = {}
    for i, node_data in enumerate(data.nodes):
        node = RuleNode(
            rule_id=rule.id,
            node_type=node_data.node_type,
            node_subtype=node_data.node_subtype,
            config=node_data.config,
            position_x=node_data.position_x,
            position_y=node_data.position_y,
        )
        session.add(node)
        await session.flush()
        temp_to_real[i] = node.id

    # Create new edges (edge node IDs are array indices, remap to real IDs)
    for edge_data in data.edges:
        edge = RuleEdge(
            rule_id=rule.id,
            source_node_id=temp_to_real[edge_data.source_node_id],
            source_port=edge_data.source_port,
            target_node_id=temp_to_real[edge_data.target_node_id],
            target_port=edge_data.target_port,
        )
        session.add(edge)

    await session.commit()

    result = await session.execute(
        select(Rule).where(Rule.id == rule.id).options(*_load_rule_options())
    )
    return result.scalar_one()


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(rule_id: int, session: AsyncSession = Depends(get_session)):
    rule = await session.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await session.delete(rule)
    await session.commit()
