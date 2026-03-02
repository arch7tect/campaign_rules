# Campaign Rules Engine

A campaign management system with an event-driven rule engine and a visual rule editor. Manages contacts with dynamic attributes, organizes them into campaigns, and executes rules defined as directed graphs (Event -> Condition -> Action).

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async), Pydantic v2
- **Database**: SQLite (via aiosqlite), upgradeable to PostgreSQL
- **Migrations**: Alembic
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, @xyflow/react, TanStack Query

## Quick Start

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -e ".[dev]"

# Run database migrations
cd backend && alembic upgrade head && cd ..

# Start the backend server
uvicorn backend.app.main:app --reload

# In a separate terminal, start the frontend
cd frontend
npm install
npm run dev
```

The API will be available at `http://localhost:8000` (docs at `/docs`). The frontend runs at `http://localhost:5173` and proxies API requests to the backend.

## Project Structure

```
backend/
  app/
    main.py              # FastAPI application entry point
    config.py            # Settings (env-based via pydantic-settings)
    database.py          # Async SQLAlchemy engine and session
    models/              # SQLAlchemy ORM models
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
  tests/                 # Test suite (59 tests)
frontend/
  src/
    api/                 # Typed fetch wrapper + resource API modules
    hooks/               # TanStack Query hooks per resource
    types/               # TypeScript types mirroring backend schemas
    components/
      ui/                # shadcn/ui components
      layout/            # AppSidebar, PageHeader
      campaigns/         # CampaignForm
      contacts/          # ContactForm
      attributes/        # AttributeForm
    pages/               # Route pages (CampaignList, CampaignDetail, ContactList, ContactDetail, RuleEditor)
    editor/              # Visual rule editor
      nodes/             # Custom react-flow nodes (Event, Condition, Action)
      edges/             # Custom edge components (LabeledEdge)
      config-forms/      # Node configuration forms (7 form components)
      utils/             # Serialization (react-flow <-> backend)
      NodePalette.tsx    # Draggable node palette
      ConfigPanel.tsx    # Node config side panel
      RuleFlowEditor.tsx # Main editor canvas
    components/
      CodeEditor.tsx     # CodeMirror 6 Python editor
```

## Frontend

### Management Pages

- **Campaigns** -- list, create, edit campaigns.
  - Campaign detail is edited by clicking the campaign name (no separate edit action button).
  - Detail page has four tabs:
  - Rules -- list with active toggle, link to visual editor
  - Members -- add/remove contacts from campaign; member editing is opened by clicking the member name
  - Attributes -- define campaign-specific dynamic attributes
  - Communications -- view and cancel scheduled communications
- **Contacts** -- list, create, edit contacts.
  - Contact pages manage contact data and attribute values.
  - Contact attribute metadata is managed separately on `/contact-attributes`.
- **Script Actions** -- script library CRUD at `/script-actions`; rules reference these actions and pass params at runtime.

### Visual Rule Editor

Full-screen graph editor for building rules:

- **Rules sidebar** -- supports multi-rule editing per campaign and is hidden by default (toggle with Show/Hide Rules)
- **Node Palette** (left) -- drag event/condition/action nodes onto the canvas
- **Canvas** (center) -- connect nodes with edges, pan/zoom, auto-layout
  - Condition nodes display each check inline as `port: left op right` (e.g., `high: contact.score > 80`)
  - New edges start with an empty label by default; labels are editable
  - Nodes can be given custom display names via the config panel
- **Config Panel** (right) -- click a node to configure it:
  - Event nodes: set event type or custom event name
  - Condition nodes: define variable checks with operators, ports, and else branch
    - Expression source is allowed only on the right side of a check
  - Action nodes: configure model modifications, scripts, communications, or triggered events
  - Python fields (expressions/scripts) use CodeMirror with syntax highlighting
  - Run Script action selects a script from the script-action library and passes JSON params
  - Attribute selectors load defined attributes from the API for the current campaign
- **Connection validation** -- no edges into event nodes, no self-loops
- **Rule start validation** -- if a rule has multiple event nodes, each must have exactly one outgoing edge and all must target the same single condition/action node
- **Save** -- serializes the graph and sends `PUT /api/rules/{id}/graph`

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
- `run_script` -- execute sandboxed Python script with access to context variables (`contact_*`, `member_*`, `conv_*`). Supports `return` statements; returning a dict applies modifications (e.g., `return {"contact.score": 100}`)
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
| POST/GET/PATCH/DELETE | `/api/script-actions/` | Script action library CRUD |
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

The test suite covers attribute validation, condition evaluation, action execution, graph traversal, scripting (including `return` support), and API integration (59 tests).
