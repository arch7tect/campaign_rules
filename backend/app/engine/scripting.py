"""Safe Python exec wrapper with restricted globals."""

import textwrap
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


def _has_return(script: str) -> bool:
    """Check if script contains a top-level return statement."""
    try:
        compile(script, "<script>", "exec")
        return False  # Compiled fine without function wrapper, no return
    except SyntaxError as e:
        if "return" in str(e).lower():
            return True
        raise


def safe_exec(script: str, local_vars: dict[str, Any]) -> dict[str, Any]:
    """Execute a Python script with restricted globals.

    If the script contains ``return`` statements, it is wrapped in a
    function automatically. A returned dict is stored as ``_result``.

    Returns the local namespace after execution.
    """
    restricted_globals: dict[str, Any] = {
        "__builtins__": SAFE_BUILTINS,
    }
    local_ns = dict(local_vars)

    try:
        if _has_return(script):
            # Wrap in function so return works; pass vars via globals
            globals_with_vars = dict(restricted_globals)
            globals_with_vars.update(local_vars)
            indented = textwrap.indent(script, "    ")
            wrapped = f"def _user_fn():\n{indented}\n_return_value = _user_fn()"
            wrap_ns: dict[str, Any] = {}
            exec(wrapped, globals_with_vars, wrap_ns)
            # Merge back
            local_ns.update(wrap_ns)
            if "_return_value" in wrap_ns and wrap_ns["_return_value"] is not None:
                ret = wrap_ns["_return_value"]
                if isinstance(ret, dict):
                    local_ns.setdefault("_result", {}).update(ret)
        else:
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
