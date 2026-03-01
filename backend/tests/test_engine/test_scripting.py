import pytest

from backend.app.engine.scripting import safe_eval, safe_exec


def test_safe_eval_basic():
    assert safe_eval("2 + 2", {}) == 4


def test_safe_eval_with_locals():
    assert safe_eval("x * 2", {"x": 5}) == 10


def test_safe_eval_no_import():
    with pytest.raises(RuntimeError):
        safe_eval("__import__('os')", {})


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
