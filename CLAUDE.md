# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install
pip install -e ".[dev]"

# Run server
uvicorn backend.app.main:app --reload

# Run all tests
pytest

# Run specific test file or directory
pytest backend/tests/test_engine/test_executor.py
pytest backend/tests/test_api/

# Database migrations
cd backend && alembic upgrade head && cd ..
cd backend && alembic revision --autogenerate -m "description" && cd ..
```

## Architecture

Campaign rules engine with async FastAPI backend. Four layers:

**API** (`api/`) -- FastAPI routers, one per resource. All routes are async, receive `AsyncSession` via `Depends(get_session)`. Standard CRUD pattern: POST (201), GET, PATCH, DELETE (204). Dynamic attributes on contacts and campaign members are validated against `AttributeDefinition` metadata before persistence.

**Services** (`services/`) -- `event_service.py` dispatches events to the rule engine. `attribute_validator.py` validates dynamic JSON attributes against `AttributeDefinition` records (type coercion, constraints).

**Engine** (`engine/`) -- Rule execution core:
- `executor.py`: `RuleExecutor` loads active rules for a campaign, finds matching event nodes, traverses the graph via adjacency dict `edges_by_source[(node_id, port)]`. Cycle detection via visited set, MAX_DEPTH=50 guard.
- `context.py`: `ExecutionContext` wraps contact + campaign_member + conversation_results. Provides `get(object_type, attr)` / `set(object_type, attr, value)`. `to_locals()` builds prefixed variable dict (`contact_*`, `member_*`, `conv_*`) for script execution.
- `conditions.py`: Evaluates `VariableCheckConditionConfig` -- iterates checks, returns first matching port name or "else".
- `actions.py`: Five action executors (modify_model, cancel/schedule communications, run_script, trigger_event). `trigger_event` re-enters the executor with incremented depth.
- `scripting.py`: `safe_exec()`/`safe_eval()` with restricted builtins (no `__import__`, `open`, `os`, `sys`).

**Models** (`models/`) -- SQLAlchemy 2.0 async ORM with `mapped_column`. `Base` declared in `models/__init__.py`, all models imported there for Alembic autogenerate. Hybrid storage: fixed columns for indexed fields + JSON column for dynamic attributes.

## Key Patterns

- **Discriminated unions** for node configs in `schemas/rule.py`: `EventConfig`, `ActionConfig` use `Field(discriminator=...)`. Each node subtype has a typed Pydantic config model.
- **Port-based graph routing**: Condition nodes output named ports (e.g., "high", "else"). Action nodes output "default". Edges connect `(source_node_id, source_port)` to `(target_node_id, target_port)`.
- **ORM-to-schema conversion**: All Read schemas use `model_config = {"from_attributes": True}`.
- **Attribute updates merge**: PATCH endpoints merge new attributes into existing JSON dict, then validate the merged result.

## Commit Rules

- One-line commit messages only
- Never mention AI tools (Claude, Codex, etc.) in commits
- Don't use emoji

## Config

Environment variables prefixed with `RULES_` (via pydantic-settings): `RULES_DATABASE_URL` (default: `sqlite+aiosqlite:///./rules.db`), `RULES_ECHO_SQL`.

## Testing

Tests use in-memory SQLite via `conftest.py` fixtures. `session` fixture creates/drops all tables per test. `client` fixture overrides `get_session` dependency for API tests using `httpx.AsyncClient` with `ASGITransport`.
