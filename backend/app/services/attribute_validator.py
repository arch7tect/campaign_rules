import re
from datetime import date, datetime
from typing import Any

from backend.app.models.attribute import AttributeDefinition, DataType


class AttributeValidationError(Exception):
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(f"Attribute validation failed: {'; '.join(errors)}")


def validate_attributes(
    attributes: dict[str, Any],
    definitions: list[AttributeDefinition],
) -> dict[str, Any]:
    """Validate and coerce attributes against their definitions.

    Returns the validated/coerced attributes dict.
    Raises AttributeValidationError on failures.
    """
    errors: list[str] = []
    result: dict[str, Any] = {}
    defs_by_name = {d.name: d for d in definitions if not d.is_fixed}

    # Check required fields
    for defn in definitions:
        if defn.is_fixed:
            continue
        constraints = defn.constraints or {}
        if isinstance(constraints, dict) and constraints.get("required"):
            if defn.name not in attributes or attributes[defn.name] is None:
                default = constraints.get("default")
                if default is not None:
                    result[defn.name] = default
                else:
                    errors.append(f"Required attribute '{defn.name}' is missing")

    # Validate provided attributes
    for key, value in attributes.items():
        defn = defs_by_name.get(key)
        if defn is None:
            # Allow unknown attributes (forward compatibility)
            result[key] = value
            continue

        if value is None:
            result[key] = None
            continue

        try:
            validated = _validate_value(key, value, defn)
            result[key] = validated
        except ValueError as e:
            errors.append(str(e))

    if errors:
        raise AttributeValidationError(errors)

    return result


def _validate_value(name: str, value: Any, defn: AttributeDefinition) -> Any:
    constraints = defn.constraints if isinstance(defn.constraints, dict) else {}

    match defn.data_type:
        case DataType.STRING | DataType.PHONE | DataType.EMAIL | DataType.URL:
            if not isinstance(value, str):
                value = str(value)
            if constraints.get("min_length") and len(value) < constraints["min_length"]:
                raise ValueError(
                    f"'{name}' must be at least {constraints['min_length']} characters"
                )
            if constraints.get("max_length") and len(value) > constraints["max_length"]:
                raise ValueError(
                    f"'{name}' must be at most {constraints['max_length']} characters"
                )
            if constraints.get("validation_regex"):
                if not re.match(constraints["validation_regex"], value):
                    raise ValueError(f"'{name}' does not match pattern")
            return value

        case DataType.INT:
            if not isinstance(value, int) or isinstance(value, bool):
                try:
                    value = int(value)
                except (ValueError, TypeError):
                    raise ValueError(f"'{name}' must be an integer")
            _check_range(name, value, constraints)
            return value

        case DataType.FLOAT:
            if not isinstance(value, (int, float)) or isinstance(value, bool):
                try:
                    value = float(value)
                except (ValueError, TypeError):
                    raise ValueError(f"'{name}' must be a number")
            _check_range(name, value, constraints)
            return float(value)

        case DataType.BOOL:
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                if value.lower() in ("true", "1", "yes"):
                    return True
                if value.lower() in ("false", "0", "no"):
                    return False
            raise ValueError(f"'{name}' must be a boolean")

        case DataType.DATE:
            if isinstance(value, date):
                return value.isoformat()
            if isinstance(value, str):
                try:
                    date.fromisoformat(value)
                    return value
                except ValueError:
                    pass
            raise ValueError(f"'{name}' must be a valid date (YYYY-MM-DD)")

        case DataType.DATETIME:
            if isinstance(value, datetime):
                return value.isoformat()
            if isinstance(value, str):
                try:
                    datetime.fromisoformat(value)
                    return value
                except ValueError:
                    pass
            raise ValueError(f"'{name}' must be a valid datetime")

        case DataType.ENUM:
            allowed = constraints.get("enum_values", [])
            if value not in allowed:
                raise ValueError(
                    f"'{name}' must be one of {allowed}, got '{value}'"
                )
            return value

        case DataType.LIST:
            if not isinstance(value, list):
                raise ValueError(f"'{name}' must be a list")
            return value

    return value


def _check_range(name: str, value: float, constraints: dict) -> None:
    if constraints.get("min_value") is not None and value < constraints["min_value"]:
        raise ValueError(f"'{name}' must be >= {constraints['min_value']}")
    if constraints.get("max_value") is not None and value > constraints["max_value"]:
        raise ValueError(f"'{name}' must be <= {constraints['max_value']}")
