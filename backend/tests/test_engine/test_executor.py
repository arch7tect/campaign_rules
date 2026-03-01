import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.engine.context import ExecutionContext
from backend.app.engine.executor import RuleExecutor
from backend.app.models.campaign import Campaign, CampaignStatus
from backend.app.models.campaign_member import CampaignMember, MemberStatus
from backend.app.models.communication import CommunicationStatus, ScheduledCommunication
from backend.app.models.contact import ContactInfo
from backend.app.models.rule import NodeType, Rule, RuleEdge, RuleNode


@pytest_asyncio.fixture
async def setup_data(session: AsyncSession):
    """Create a contact, campaign, and member for testing."""
    contact = ContactInfo(
        first_name="Alice", last_name="Smith", email="alice@test.com", attributes={"score": 0}
    )
    session.add(contact)

    campaign = Campaign(name="Test Campaign", status=CampaignStatus.ACTIVE)
    session.add(campaign)
    await session.flush()

    member = CampaignMember(
        contact_id=contact.id, campaign_id=campaign.id, attributes={"calls": 0}
    )
    session.add(member)
    await session.commit()

    return contact, campaign, member


@pytest.mark.asyncio
async def test_simple_event_to_action(session: AsyncSession, setup_data):
    """Event → Action: modify_model sets contact.score = 100."""
    contact, campaign, member = setup_data

    rule = Rule(campaign_id=campaign.id, name="Set Score", is_active=True)
    session.add(rule)
    await session.flush()

    event_node = RuleNode(
        rule_id=rule.id,
        node_type=NodeType.EVENT,
        node_subtype="member_added",
        config={"event_type": "member_added"},
        position_x=0, position_y=0,
    )
    action_node = RuleNode(
        rule_id=rule.id,
        node_type=NodeType.ACTION,
        node_subtype="modify_model",
        config={
            "action_type": "modify_model",
            "assignments": [
                {
                    "object_type": "contact",
                    "attribute_name": "score",
                    "value": {"source": "constant", "value": 100},
                }
            ],
        },
        position_x=200, position_y=0,
    )
    session.add_all([event_node, action_node])
    await session.flush()

    edge = RuleEdge(
        rule_id=rule.id,
        source_node_id=event_node.id, source_port="default",
        target_node_id=action_node.id, target_port="default",
    )
    session.add(edge)
    await session.commit()

    ctx = ExecutionContext(session=session, contact=contact, campaign_member=member)
    executor = RuleExecutor(session)
    await executor.execute_event(campaign.id, "member_added", ctx)

    assert ctx.contact.attributes["score"] == 100


@pytest.mark.asyncio
async def test_event_condition_action(session: AsyncSession, setup_data):
    """Event → Condition (score > 50?) → [yes] Action (set status)."""
    contact, campaign, member = setup_data
    contact.attributes = {"score": 80}
    await session.commit()

    rule = Rule(campaign_id=campaign.id, name="Check Score", is_active=True)
    session.add(rule)
    await session.flush()

    event_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.EVENT, node_subtype="contact_updated",
        config={"event_type": "contact_updated"}, position_x=0, position_y=0,
    )
    condition_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.CONDITION, node_subtype="variable_check",
        config={
            "condition_type": "variable_check",
            "checks": [
                {
                    "left": {"source": "attribute", "object_type": "contact", "attribute_name": "score"},
                    "operator": "gt",
                    "right": {"source": "constant", "value": 50},
                    "port_name": "high",
                }
            ],
            "has_else_port": True,
        },
        position_x=200, position_y=0,
    )
    action_high = RuleNode(
        rule_id=rule.id, node_type=NodeType.ACTION, node_subtype="modify_model",
        config={
            "action_type": "modify_model",
            "assignments": [
                {
                    "object_type": "contact",
                    "attribute_name": "tier",
                    "value": {"source": "constant", "value": "premium"},
                }
            ],
        },
        position_x=400, position_y=0,
    )
    action_else = RuleNode(
        rule_id=rule.id, node_type=NodeType.ACTION, node_subtype="modify_model",
        config={
            "action_type": "modify_model",
            "assignments": [
                {
                    "object_type": "contact",
                    "attribute_name": "tier",
                    "value": {"source": "constant", "value": "basic"},
                }
            ],
        },
        position_x=400, position_y=100,
    )
    session.add_all([event_node, condition_node, action_high, action_else])
    await session.flush()

    edges = [
        RuleEdge(rule_id=rule.id, source_node_id=event_node.id, source_port="default",
                 target_node_id=condition_node.id, target_port="default"),
        RuleEdge(rule_id=rule.id, source_node_id=condition_node.id, source_port="high",
                 target_node_id=action_high.id, target_port="default"),
        RuleEdge(rule_id=rule.id, source_node_id=condition_node.id, source_port="else",
                 target_node_id=action_else.id, target_port="default"),
    ]
    session.add_all(edges)
    await session.commit()

    ctx = ExecutionContext(session=session, contact=contact, campaign_member=member)
    executor = RuleExecutor(session)
    await executor.execute_event(campaign.id, "contact_updated", ctx)

    assert ctx.contact.attributes["tier"] == "premium"


@pytest.mark.asyncio
async def test_condition_else_branch(session: AsyncSession, setup_data):
    """When condition doesn't match, else branch fires."""
    contact, campaign, member = setup_data
    contact.attributes = {"score": 30}
    await session.commit()

    rule = Rule(campaign_id=campaign.id, name="Check Score Else", is_active=True)
    session.add(rule)
    await session.flush()

    event_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.EVENT, node_subtype="contact_updated",
        config={"event_type": "contact_updated"}, position_x=0, position_y=0,
    )
    condition_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.CONDITION, node_subtype="variable_check",
        config={
            "condition_type": "variable_check",
            "checks": [
                {
                    "left": {"source": "attribute", "object_type": "contact", "attribute_name": "score"},
                    "operator": "gt",
                    "right": {"source": "constant", "value": 50},
                    "port_name": "high",
                }
            ],
            "has_else_port": True,
        },
        position_x=200, position_y=0,
    )
    action_else = RuleNode(
        rule_id=rule.id, node_type=NodeType.ACTION, node_subtype="modify_model",
        config={
            "action_type": "modify_model",
            "assignments": [
                {
                    "object_type": "contact",
                    "attribute_name": "tier",
                    "value": {"source": "constant", "value": "basic"},
                }
            ],
        },
        position_x=400, position_y=100,
    )
    session.add_all([event_node, condition_node, action_else])
    await session.flush()

    edges = [
        RuleEdge(rule_id=rule.id, source_node_id=event_node.id, source_port="default",
                 target_node_id=condition_node.id, target_port="default"),
        RuleEdge(rule_id=rule.id, source_node_id=condition_node.id, source_port="else",
                 target_node_id=action_else.id, target_port="default"),
    ]
    session.add_all(edges)
    await session.commit()

    ctx = ExecutionContext(session=session, contact=contact, campaign_member=member)
    executor = RuleExecutor(session)
    await executor.execute_event(campaign.id, "contact_updated", ctx)

    assert ctx.contact.attributes["tier"] == "basic"


@pytest.mark.asyncio
async def test_schedule_communication_action(session: AsyncSession, setup_data):
    """Action creates a ScheduledCommunication record."""
    contact, campaign, member = setup_data

    rule = Rule(campaign_id=campaign.id, name="Schedule Call", is_active=True)
    session.add(rule)
    await session.flush()

    event_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.EVENT, node_subtype="member_added",
        config={"event_type": "member_added"}, position_x=0, position_y=0,
    )
    action_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.ACTION, node_subtype="schedule_communication",
        config={
            "action_type": "schedule_communication",
            "channel": "phone",
            "agent_params": {"script_id": "welcome"},
        },
        position_x=200, position_y=0,
    )
    session.add_all([event_node, action_node])
    await session.flush()

    edge = RuleEdge(
        rule_id=rule.id, source_node_id=event_node.id, source_port="default",
        target_node_id=action_node.id, target_port="default",
    )
    session.add(edge)
    await session.commit()

    ctx = ExecutionContext(session=session, contact=contact, campaign_member=member)
    executor = RuleExecutor(session)
    await executor.execute_event(campaign.id, "member_added", ctx)
    await session.commit()

    from sqlalchemy import select
    result = await session.execute(select(ScheduledCommunication))
    comms = result.scalars().all()
    assert len(comms) == 1
    assert comms[0].channel == "phone"
    assert comms[0].contact_id == contact.id
    assert comms[0].status == CommunicationStatus.PENDING


@pytest.mark.asyncio
async def test_cancel_communications_action(session: AsyncSession, setup_data):
    """Cancel action cancels pending communications."""
    contact, campaign, member = setup_data

    comm = ScheduledCommunication(
        contact_id=contact.id, campaign_id=campaign.id,
        campaign_member_id=member.id, channel="phone",
    )
    session.add(comm)
    await session.commit()

    rule = Rule(campaign_id=campaign.id, name="Cancel Comms", is_active=True)
    session.add(rule)
    await session.flush()

    event_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.EVENT, node_subtype="conversation_ended",
        config={"event_type": "conversation_ended"}, position_x=0, position_y=0,
    )
    action_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.ACTION, node_subtype="cancel_communications",
        config={"action_type": "cancel_communications"},
        position_x=200, position_y=0,
    )
    session.add_all([event_node, action_node])
    await session.flush()

    edge = RuleEdge(
        rule_id=rule.id, source_node_id=event_node.id, source_port="default",
        target_node_id=action_node.id, target_port="default",
    )
    session.add(edge)
    await session.commit()

    ctx = ExecutionContext(session=session, contact=contact, campaign_member=member)
    executor = RuleExecutor(session)
    await executor.execute_event(campaign.id, "conversation_ended", ctx)
    await session.commit()

    await session.refresh(comm)
    assert comm.status == CommunicationStatus.CANCELLED


@pytest.mark.asyncio
async def test_run_script_action(session: AsyncSession, setup_data):
    """Run script sets values via _result dict."""
    contact, campaign, member = setup_data

    rule = Rule(campaign_id=campaign.id, name="Run Script", is_active=True)
    session.add(rule)
    await session.flush()

    event_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.EVENT, node_subtype="member_added",
        config={"event_type": "member_added"}, position_x=0, position_y=0,
    )
    action_node = RuleNode(
        rule_id=rule.id, node_type=NodeType.ACTION, node_subtype="run_script",
        config={
            "action_type": "run_script",
            "script": "_result = {'contact.computed': contact_first_name + ' ' + contact_last_name}",
        },
        position_x=200, position_y=0,
    )
    session.add_all([event_node, action_node])
    await session.flush()

    edge = RuleEdge(
        rule_id=rule.id, source_node_id=event_node.id, source_port="default",
        target_node_id=action_node.id, target_port="default",
    )
    session.add(edge)
    await session.commit()

    ctx = ExecutionContext(session=session, contact=contact, campaign_member=member)
    executor = RuleExecutor(session)
    await executor.execute_event(campaign.id, "member_added", ctx)

    assert ctx.contact.attributes["computed"] == "Alice Smith"


@pytest.mark.asyncio
async def test_custom_event_trigger(session: AsyncSession, setup_data):
    """trigger_event action fires a custom event that another rule catches."""
    contact, campaign, member = setup_data

    # Rule 1: member_added → trigger_event("follow_up")
    rule1 = Rule(campaign_id=campaign.id, name="Trigger", is_active=True)
    session.add(rule1)
    await session.flush()

    ev1 = RuleNode(rule_id=rule1.id, node_type=NodeType.EVENT, node_subtype="member_added",
                   config={"event_type": "member_added"}, position_x=0, position_y=0)
    act1 = RuleNode(rule_id=rule1.id, node_type=NodeType.ACTION, node_subtype="trigger_event",
                    config={"action_type": "trigger_event", "event_name": "follow_up"},
                    position_x=200, position_y=0)
    session.add_all([ev1, act1])
    await session.flush()
    session.add(RuleEdge(rule_id=rule1.id, source_node_id=ev1.id, source_port="default",
                         target_node_id=act1.id, target_port="default"))

    # Rule 2: custom(follow_up) → modify_model
    rule2 = Rule(campaign_id=campaign.id, name="Handle Follow Up", is_active=True)
    session.add(rule2)
    await session.flush()

    ev2 = RuleNode(rule_id=rule2.id, node_type=NodeType.EVENT, node_subtype="custom",
                   config={"event_type": "custom", "event_name": "follow_up"},
                   position_x=0, position_y=0)
    act2 = RuleNode(rule_id=rule2.id, node_type=NodeType.ACTION, node_subtype="modify_model",
                    config={
                        "action_type": "modify_model",
                        "assignments": [{
                            "object_type": "contact",
                            "attribute_name": "followed_up",
                            "value": {"source": "constant", "value": True},
                        }],
                    }, position_x=200, position_y=0)
    session.add_all([ev2, act2])
    await session.flush()
    session.add(RuleEdge(rule_id=rule2.id, source_node_id=ev2.id, source_port="default",
                         target_node_id=act2.id, target_port="default"))
    await session.commit()

    ctx = ExecutionContext(session=session, contact=contact, campaign_member=member)
    executor = RuleExecutor(session)
    await executor.execute_event(campaign.id, "member_added", ctx)

    assert ctx.contact.attributes.get("followed_up") is True
