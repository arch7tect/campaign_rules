import pytest

from backend.app.models.attribute import AttributeDefinition, DataType, OwnerType
from backend.app.services.attribute_validator import (
    AttributeValidationError,
    validate_attributes,
)


def _make_def(name: str, data_type: DataType, constraints: dict | None = None) -> AttributeDefinition:
    d = AttributeDefinition()
    d.name = name
    d.display_name = name
    d.data_type = data_type
    d.owner_type = OwnerType.CONTACT
    d.constraints = constraints
    d.is_fixed = False
    return d


def test_string_validation():
    defs = [_make_def("nickname", DataType.STRING, {"max_length": 10})]
    result = validate_attributes({"nickname": "Bob"}, defs)
    assert result["nickname"] == "Bob"


def test_string_too_long():
    defs = [_make_def("nickname", DataType.STRING, {"max_length": 3})]
    with pytest.raises(AttributeValidationError):
        validate_attributes({"nickname": "Bobby"}, defs)


def test_int_validation():
    defs = [_make_def("age", DataType.INT, {"min_value": 0, "max_value": 150})]
    result = validate_attributes({"age": 25}, defs)
    assert result["age"] == 25


def test_int_coercion():
    defs = [_make_def("age", DataType.INT)]
    result = validate_attributes({"age": "30"}, defs)
    assert result["age"] == 30


def test_int_out_of_range():
    defs = [_make_def("age", DataType.INT, {"min_value": 0})]
    with pytest.raises(AttributeValidationError):
        validate_attributes({"age": -1}, defs)


def test_bool_validation():
    defs = [_make_def("active", DataType.BOOL)]
    result = validate_attributes({"active": True}, defs)
    assert result["active"] is True

    result = validate_attributes({"active": "yes"}, defs)
    assert result["active"] is True


def test_enum_validation():
    defs = [_make_def("status", DataType.ENUM, {"enum_values": ["new", "hot", "cold"]})]
    result = validate_attributes({"status": "hot"}, defs)
    assert result["status"] == "hot"


def test_enum_invalid():
    defs = [_make_def("status", DataType.ENUM, {"enum_values": ["new", "hot"]})]
    with pytest.raises(AttributeValidationError):
        validate_attributes({"status": "unknown"}, defs)


def test_required_missing():
    defs = [_make_def("name", DataType.STRING, {"required": True})]
    with pytest.raises(AttributeValidationError):
        validate_attributes({}, defs)


def test_required_with_default():
    defs = [_make_def("name", DataType.STRING, {"required": True, "default": "N/A"})]
    result = validate_attributes({}, defs)
    assert result["name"] == "N/A"


def test_regex_validation():
    defs = [_make_def("code", DataType.STRING, {"validation_regex": r"^[A-Z]{3}\d{3}$"})]
    result = validate_attributes({"code": "ABC123"}, defs)
    assert result["code"] == "ABC123"

    with pytest.raises(AttributeValidationError):
        validate_attributes({"code": "abc"}, defs)


def test_unknown_attrs_passed_through():
    defs = [_make_def("name", DataType.STRING)]
    result = validate_attributes({"name": "Bob", "unknown_field": 42}, defs)
    assert result["unknown_field"] == 42


def test_none_value_allowed():
    defs = [_make_def("name", DataType.STRING)]
    result = validate_attributes({"name": None}, defs)
    assert result["name"] is None


def test_date_validation():
    defs = [_make_def("birth", DataType.DATE)]
    result = validate_attributes({"birth": "2000-01-15"}, defs)
    assert result["birth"] == "2000-01-15"

    with pytest.raises(AttributeValidationError):
        validate_attributes({"birth": "not-a-date"}, defs)


def test_list_validation():
    defs = [_make_def("tags", DataType.LIST)]
    result = validate_attributes({"tags": ["a", "b"]}, defs)
    assert result["tags"] == ["a", "b"]

    with pytest.raises(AttributeValidationError):
        validate_attributes({"tags": "not-a-list"}, defs)
