import pytest
from unittest.mock import MagicMock

from backend.app.engine.conditions import compare, evaluate_variable_check, resolve_value
from backend.app.engine.context import ExecutionContext
from backend.app.models.campaign_member import CampaignMember, MemberStatus
from backend.app.models.contact import ContactInfo
from backend.app.schemas.rule import (
    ComparisonOperator,
    ValueRef,
    ValueSource,
    VariableCheck,
    VariableCheckConditionConfig,
)


def _make_ctx(**contact_attrs) -> ExecutionContext:
    contact = ContactInfo()
    contact.id = 1
    contact.first_name = "John"
    contact.last_name = "Doe"
    contact.email = "john@example.com"
    contact.phone = "+1234567890"
    contact.attributes = contact_attrs

    member = CampaignMember()
    member.id = 1
    member.contact_id = 1
    member.campaign_id = 1
    member.status = MemberStatus.ACTIVE
    member.attributes = {}

    return ExecutionContext(
        session=MagicMock(),
        contact=contact,
        campaign_member=member,
    )


class TestCompare:
    def test_eq(self):
        assert compare("a", ComparisonOperator.EQ, "a")
        assert not compare("a", ComparisonOperator.EQ, "b")

    def test_neq(self):
        assert compare("a", ComparisonOperator.NEQ, "b")

    def test_gt(self):
        assert compare(5, ComparisonOperator.GT, 3)
        assert not compare(3, ComparisonOperator.GT, 5)

    def test_gte(self):
        assert compare(5, ComparisonOperator.GTE, 5)

    def test_contains(self):
        assert compare("hello world", ComparisonOperator.CONTAINS, "world")
        assert not compare("hello", ComparisonOperator.CONTAINS, "world")

    def test_is_null(self):
        assert compare(None, ComparisonOperator.IS_NULL, None)
        assert not compare("x", ComparisonOperator.IS_NULL, None)

    def test_is_not_null(self):
        assert compare("x", ComparisonOperator.IS_NOT_NULL, None)

    def test_in(self):
        assert compare("a", ComparisonOperator.IN, ["a", "b"])
        assert not compare("c", ComparisonOperator.IN, ["a", "b"])

    def test_matches(self):
        assert compare("abc123", ComparisonOperator.MATCHES, r"\d+")
        assert not compare("abc", ComparisonOperator.MATCHES, r"^\d+$")

    def test_starts_with(self):
        assert compare("hello", ComparisonOperator.STARTS_WITH, "hel")

    def test_ends_with(self):
        assert compare("hello", ComparisonOperator.ENDS_WITH, "llo")


class TestResolveValue:
    def test_constant(self):
        ctx = _make_ctx()
        ref = ValueRef(source=ValueSource.CONSTANT, value=42)
        assert resolve_value(ref, ctx) == 42

    def test_attribute_fixed(self):
        ctx = _make_ctx()
        ref = ValueRef(
            source=ValueSource.ATTRIBUTE,
            object_type="contact",
            attribute_name="first_name",
        )
        assert resolve_value(ref, ctx) == "John"

    def test_attribute_dynamic(self):
        ctx = _make_ctx(score=95)
        ref = ValueRef(
            source=ValueSource.ATTRIBUTE,
            object_type="contact",
            attribute_name="score",
        )
        assert resolve_value(ref, ctx) == 95

    def test_expression(self):
        ctx = _make_ctx(score=80)
        ref = ValueRef(
            source=ValueSource.EXPRESSION,
            expression="contact_score > 50",
        )
        assert resolve_value(ref, ctx) is True


class TestEvaluateVariableCheck:
    def test_matching_check(self):
        ctx = _make_ctx(score=90)
        config = VariableCheckConditionConfig(
            checks=[
                VariableCheck(
                    left=ValueRef(source=ValueSource.ATTRIBUTE, object_type="contact", attribute_name="score"),
                    operator=ComparisonOperator.GT,
                    right=ValueRef(source=ValueSource.CONSTANT, value=80),
                    port_name="high",
                ),
            ]
        )
        assert evaluate_variable_check(config, ctx) == "high"

    def test_else_port(self):
        ctx = _make_ctx(score=50)
        config = VariableCheckConditionConfig(
            checks=[
                VariableCheck(
                    left=ValueRef(source=ValueSource.ATTRIBUTE, object_type="contact", attribute_name="score"),
                    operator=ComparisonOperator.GT,
                    right=ValueRef(source=ValueSource.CONSTANT, value=80),
                    port_name="high",
                ),
            ],
            has_else_port=True,
        )
        assert evaluate_variable_check(config, ctx) == "else"

    def test_no_else_port(self):
        ctx = _make_ctx(score=50)
        config = VariableCheckConditionConfig(
            checks=[
                VariableCheck(
                    left=ValueRef(source=ValueSource.ATTRIBUTE, object_type="contact", attribute_name="score"),
                    operator=ComparisonOperator.GT,
                    right=ValueRef(source=ValueSource.CONSTANT, value=80),
                    port_name="high",
                ),
            ],
            has_else_port=False,
        )
        assert evaluate_variable_check(config, ctx) is None

    def test_first_match_wins(self):
        ctx = _make_ctx(score=90)
        config = VariableCheckConditionConfig(
            checks=[
                VariableCheck(
                    left=ValueRef(source=ValueSource.ATTRIBUTE, object_type="contact", attribute_name="score"),
                    operator=ComparisonOperator.GT,
                    right=ValueRef(source=ValueSource.CONSTANT, value=80),
                    port_name="high",
                ),
                VariableCheck(
                    left=ValueRef(source=ValueSource.ATTRIBUTE, object_type="contact", attribute_name="score"),
                    operator=ComparisonOperator.GT,
                    right=ValueRef(source=ValueSource.CONSTANT, value=50),
                    port_name="medium",
                ),
            ],
        )
        assert evaluate_variable_check(config, ctx) == "high"
