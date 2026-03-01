"""Safe Python exec wrapper with restricted globals."""

from typing import Any

FORBIDDEN_BUILTINS = {
    "__import__", "exec", "eval", "compile",
    "open", "input", "breakpoint",
    "globals", "locals", "vars", "dir",
    "getattr", "setattr", "delattr",
    "memoryview", "type", "__build_class__",
}

SAFE_BUILTINS = {
    k: v
    for k, v in __builtins__.items()  # type: ignore[union-attr]
    if k not in FORBIDDEN_BUILTINS
} if isinstance(__builtins__, dict) else {
    k: getattr(__builtins__, k)
    for k in dir(__builtins__)
    if k not in FORBIDDEN_BUILTINS and not k.startswith("_")
}


def safe_exec(script: str, local_vars: dict[str, Any]) -> dict[str, Any]:
    """Execute a Python script with restricted globals.

    Returns the local namespace after execution.
    """
    restricted_globals: dict[str, Any] = {
        "__builtins__": SAFE_BUILTINS,
    }
    local_ns = dict(local_vars)

    try:
        exec(script, restricted_globals, local_ns)
    except Exception as e:
        raise RuntimeError(f"Script execution failed: {type(e).__name__}: {e}") from e

    return local_ns


def safe_eval(expression: str, local_vars: dict[str, Any]) -> Any:
    """Evaluate a Python expression with restricted globals."""
    restricted_globals: dict[str, Any] = {
        "__builtins__": SAFE_BUILTINS,
    }
    try:
        return eval(expression, restricted_globals, local_vars)
    except Exception as e:
        raise RuntimeError(f"Expression evaluation failed: {type(e).__name__}: {e}") from e
