# Campaign Rules Engine

A campaign management system with an event-driven rule engine. Manages contacts with dynamic attributes, organizes them into campaigns, and executes rules defined as directed graphs (Event -> Condition -> Action). Designed for a future visual editor built with react-flow.

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async), Pydantic v2
- **Database**: SQLite (via aiosqlite), upgradeable to PostgreSQL
- **Migrations**: Alembic
- **Frontend** (future): React + react-flow

## Quick Start

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run database migrations
cd backend && alembic upgrade head && cd ..

# Start the server
uvicorn backend.app.main:app --reload

# Run tests
pytest
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## Project Structure

```
backend/
  app/
    main.py              # FastAPI application entry point
    config.py            # Settings (env-based via pydantic-settings)
    database.py          # Async SQLAlchemy engine and session
    models/              # SQLAlchemy ORM models
      contact.py         # ContactInfo
      campaign.py        # Campaign
      campaign_member.py # CampaignMember
      attribute.py       # AttributeDefinition
      rule.py            # Rule, RuleNode, RuleEdge
      communication.py   # ScheduledCommunication
    schemas/             # Pydantic schemas (API request/response + rule node configs)
    api/                 # FastAPI routers (contacts, campaigns, members, attributes, rules, events, communications)
    engine/              # Rule execution engine
      executor.py        # Graph traversal and rule execution
      context.py         # Execution context (object model access)
      conditions.py      # Condition evaluators
      actions.py         # Action executors
      scripting.py       # Sandboxed Python exec/eval
    services/            # Business logic
      event_service.py   # Event dispatch to engine
      attribute_validator.py # Dynamic attribute validation
  alembic/               # Database migrations
  tests/                 # Test suite
```

## Domain Model

- **ContactInfo** -- contact record with fixed fields (name, email, phone) and dynamic JSON attributes
- **Campaign** -- communication campaign with status (draft/active/paused/completed)
- **CampaignMember** -- links a contact to a campaign, with campaign-specific dynamic attributes
- **AttributeDefinition** -- metadata describing dynamic fields (type, constraints, validation)
- **Rule** -- directed graph of nodes and edges belonging to a campaign
- **ScheduledCommunication** -- planned communication record created by rule actions

## Rule Engine

Rules are directed graphs with three node types:

### Event Nodes (triggers)
- `member_added` -- contact enrolled in campaign
- `contact_updated` -- contact info changed
- `conversation_ended` -- conversation completed
- `conversation_updated` -- conversation results updated mid-call
- `custom` -- named event fired by another rule action

### Condition Nodes
- `variable_check` -- compare attributes against constants, other attributes, or Python expressions. Multiple checks with individual output ports and an optional "else" port.

### Action Nodes
- `modify_model` -- write attributes to Contact or CampaignMember
- `cancel_communications` -- cancel all pending communications for the contact
- `schedule_communication` -- create a ScheduledCommunication record
- `run_script` -- execute sandboxed Python script with access to context variables
- `trigger_event` -- fire a named custom event (re-enters the engine)

### Execution Flow
1. An event arrives via the `POST /api/events/` endpoint
2. The engine finds all active rules in the campaign
3. For each rule, it finds matching event nodes and traverses the graph
4. Conditions are evaluated and the appropriate output port is followed
5. Actions are executed sequentially
6. Changes are committed to the database

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST/GET/PATCH/DELETE | `/api/contacts/` | Contact CRUD |
| POST/GET/PATCH/DELETE | `/api/campaigns/` | Campaign CRUD |
| POST/GET/PATCH/DELETE | `/api/campaign-members/` | Campaign member CRUD |
| POST/GET/PATCH/DELETE | `/api/attributes/` | Attribute definition CRUD |
| POST/GET/PATCH/DELETE | `/api/rules/` | Rule CRUD |
| PUT | `/api/rules/{id}/graph` | Replace rule graph (nodes + edges) |
| GET | `/api/communications/` | List scheduled communications |
| POST | `/api/communications/{id}/cancel` | Cancel a communication |
| POST | `/api/events/` | Fire an event (triggers rule execution) |

## Dynamic Attributes

Attributes are stored in a JSON column and validated at the application level using `AttributeDefinition` metadata. Supported data types: `string`, `int`, `float`, `bool`, `date`, `datetime`, `enum`, `list`, `phone`, `email`, `url`. Constraints include: `required`, `default`, `enum_values`, `validation_regex`, `min_value`, `max_value`, `min_length`, `max_length`.

## Configuration

Environment variables (prefixed with `RULES_`):

| Variable | Default | Description |
|----------|---------|-------------|
| `RULES_DATABASE_URL` | `sqlite+aiosqlite:///./rules.db` | Database connection string |
| `RULES_ECHO_SQL` | `false` | Log SQL statements |

## Testing

```bash
pytest                    # run all tests
pytest -v                 # verbose output
pytest backend/tests/test_engine/  # engine tests only
pytest backend/tests/test_api/     # API tests only
```

The test suite covers attribute validation, condition evaluation, action execution, graph traversal, and API integration (55 tests).
