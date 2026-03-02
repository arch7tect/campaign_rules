import pytest

from backend.app.engine.scripting import safe_eval, safe_exec


def test_safe_eval_basic():
    assert safe_eval("2 + 2", {}) == 4


def test_safe_eval_with_locals():
    assert safe_eval("x * 2", {"x": 5}) == 10


def test_safe_eval_no_import():
    with pytest.raises(RuntimeError):
        safe_eval("__import__('os')", {})


def test_safe_eval_multiline_with_return():
    result = safe_eval(
        """\
x = 10
y = x + 5
return y
""",
        {},
    )
    assert result == 15


def test_safe_eval_multiline_with_final_expression():
    result = safe_eval(
        """\
x = 10
y = x + 5
y
""",
        {},
    )
    assert result == 15


def test_safe_eval_multiline_requires_value():
    with pytest.raises(RuntimeError):
        safe_eval(
            """\
x = 10
y = x + 5
""",
            {},
        )


def test_safe_exec_basic():
    result = safe_exec("y = x + 1", {"x": 10})
    assert result["y"] == 11


def test_safe_exec_no_import():
    with pytest.raises(RuntimeError):
        safe_exec("import os", {})


def test_safe_exec_no_open():
    with pytest.raises(RuntimeError):
        safe_exec("f = open('/etc/passwd')", {})


def test_safe_exec_result_dict():
    result = safe_exec(
        "_result = {'contact.score': 100}",
        {},
    )
    assert result["_result"] == {"contact.score": 100}


def test_safe_exec_return_dict():
    result = safe_exec(
        "return {'contact.score': 42}",
        {},
    )
    assert result["_result"] == {"contact.score": 42}


def test_safe_exec_return_none():
    """When return is used, script runs in a function wrapper.
    Variables assigned inside the function are not visible outside."""
    result = safe_exec("return None", {})
    assert result.get("_return_value") is None


def test_safe_exec_multiline_with_return():
    script = """\
score = contact_score + 10
if score > 100:
    score = 100
return {'contact.score': score}
"""
    result = safe_exec(script, {"contact_score": 95})
    assert result["_result"] == {"contact.score": 100}


def test_safe_exec_return_non_dict():
    result = safe_exec("return 42", {})
    assert result["_return_value"] == 42
    assert "_result" not in result
