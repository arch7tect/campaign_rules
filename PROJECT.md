# Campaign Rules Engine

## Overview

A campaign management system with an event-driven rule engine. The system manages contacts with dynamic attributes, organizes them into campaigns, and executes rules defined as directed graphs of Events, Conditions, and Actions. Rules are edited visually via react-flow diagrams.

---

## Domain Model

### ContactInfo
Master contact record.
- **Fixed fields**: id, email, phone, first_name, last_name, created_at, updated_at
- **Dynamic attributes**: stored in JSON column, described by AttributeDefinition metadata

### Campaign
Communication campaign containing rules and members.
- Fields: id, name, description, status, created_at, updated_at

### CampaignMember
A contact enrolled in a specific campaign.
- Links ContactInfo to Campaign
- Has campaign-specific dynamic attributes (defined per campaign via metadata)
- Fields: id, contact_id, campaign_id, attributes (JSON), status, created_at, updated_at

### AttributeDefinition (Metadata)
Describes a dynamic field for ContactInfo or CampaignMember.
- **name** — internal identifier
- **display_name** — human-readable label
- **data_type** — one of: string, int, float, bool, date, datetime, enum, list, phone, email, url
- **owner_type** — `contact` or `campaign_member`
- **campaign_id** — null for contact attrs; set for campaign-specific member attrs
- **constraints** — JSON: required, default, enum_values, validation_regex, min, max, etc.
- **is_fixed** — whether this attribute maps to a fixed DB column

### Rule
Belongs to a Campaign. Contains a directed graph:
- **RuleNode** — a node in the graph (Event, Condition, or Action)
  - node_type: event | condition | action
  - node_subtype: specific type (e.g., `member_added`, `variable_check`, `modify_model`)
  - config: JSON (Pydantic-serialized configuration specific to subtype)
  - position_x, position_y: visual coordinates for react-flow
- **RuleEdge** — a directed edge connecting nodes
  - source_node_id, source_port → target_node_id, target_port

### ConversationResult
Results from an external conversation system, received via API/webhook.
- Dynamic attributes that map to ContactInfo or CampaignMember fields
- Available in rule context for `conversation_ended` and `conversation_updated` events

### ScheduledCommunication
A planned communication task.
- contact_id, campaign_id, campaign_member_id
- channel (whatsapp, telegram, email, sms, sip)
- agent_params (JSON): gender, age, speech_style, etc.
- min_time, max_time: communication time window
- status: pending | cancelled | completed

---

## Event Types

| Event | Description | Context Available |
|-------|-------------|-------------------|
| `member_added` | Contact became a campaign member | contact, campaign_member |
| `contact_updated` | New contact information loaded | contact, campaign_member |
| `conversation_ended` | Conversation finished | contact, campaign_member, conversation_results |
| `conversation_updated` | Mid-conversation results update | contact, campaign_member, conversation_results |
| `custom` | Named event triggered from an action | contact, campaign_member |

A rule can listen to multiple events. All event nodes in a rule point to the same first condition or action node.

---

## Condition Types

### variable_check
Compares object model attributes against:
- Other object model attributes
- Constants
- Python expressions (with restricted execution)

Structure:
- List of checks, each with an **output port**
- Checks evaluated in order; first match → follow that port's edges
- Optional **Else** port if no checks match

Accessible objects: ContactInfo (+ CampaignMember attrs), ConversationResults (if event provides them).

---

## Action Types

| Action | Description | Parameters |
|--------|-------------|------------|
| `modify_model` | Write attributes to Contact/CampaignMember | attribute assignments (from attrs, constants, or Python script) |
| `cancel_communications` | Cancel all pending scheduled communications | — |
| `schedule_communication` | Create a ScheduledCommunication record | channel, min_time, max_time, agent_params |
| `run_script` | Execute arbitrary Python script | script code (restricted exec) |
| `trigger_event` | Fire a named custom event | event_name |

---

## Rule Execution

1. An event arrives via API endpoint
2. System finds all active rules in the campaign that listen to this event type
3. For each matching rule, per contact:
   - Find event nodes matching the event type
   - Follow outgoing edges to the next node (condition or action)
   - **Conditions**: evaluate checks in order, follow the matching port's edges
   - **Actions**: execute the action, follow outgoing edges
   - Multiple outgoing edges from a port → execute targets sequentially
   - Multiple incoming edges to a node → node executes when reached from any path
4. Execution is synchronous (no queue/workers for MVP)
5. Cycle detection and max depth guard prevent infinite loops

### Python Script Execution
- `exec()` with restricted `globals` and `locals`
- **Exposed**: contact attrs, campaign_member attrs, conversation_results
- **Blocked**: `__import__`, `open`, `os`, `sys`, `eval`, `exec`, `compile`

---

## Data Storage

### Dynamic Attributes — Hybrid Approach
- Fixed DB columns for commonly queried fields (email, phone, first_name, last_name)
- JSON column `attributes` for all dynamic fields
- `AttributeDefinition` table describes all fields (both fixed and dynamic)
- Application-level validation via Pydantic based on attribute definitions

### Rule Graph — Normalized Tables + Visual JSON
- `RuleNode` and `RuleEdge` tables for logical structure
- Visual coordinates (position_x, position_y) stored on RuleNode
- API converts to/from react-flow format (nodes + edges arrays)
- Python-side: full Pydantic models for each node subtype

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, Pydantic v2 |
| ORM | SQLAlchemy (async) |
| Database | SQLite (upgradeable to PostgreSQL) |
| Migrations | Alembic |
| Frontend (future) | React, react-flow |
| Cache (future) | Redis |
| Auth | None (MVP) |

---

## Project Structure

```
rules/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app, lifespan, CORS
│   │   ├── config.py                # Settings (Pydantic BaseSettings)
│   │   ├── database.py              # SQLAlchemy engine, session
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── contact.py           # ContactInfo
│   │   │   ├── campaign.py          # Campaign
│   │   │   ├── campaign_member.py   # CampaignMember
│   │   │   ├── attribute.py         # AttributeDefinition
│   │   │   ├── rule.py              # Rule, RuleNode, RuleEdge
│   │   │   └── communication.py     # ScheduledCommunication
│   │   ├── schemas/                 # Pydantic schemas (API + rule configs)
│   │   │   ├── contact.py
│   │   │   ├── campaign.py
│   │   │   ├── campaign_member.py
│   │   │   ├── attribute.py
│   │   │   ├── rule.py              # Rule graph + node config schemas
│   │   │   ├── communication.py
│   │   │   └── events.py            # Event payload schemas
│   │   ├── api/                     # FastAPI routers
│   │   │   ├── contacts.py
│   │   │   ├── campaigns.py
│   │   │   ├── campaign_members.py
│   │   │   ├── attributes.py
│   │   │   ├── rules.py
│   │   │   ├── events.py            # Event ingestion endpoints
│   │   │   └── communications.py
│   │   ├── engine/                  # Rule execution engine
│   │   │   ├── executor.py          # Graph traversal
│   │   │   ├── context.py           # Execution context (object model)
│   │   │   ├── conditions.py        # Condition evaluators
│   │   │   ├── actions.py           # Action executors
│   │   │   └── scripting.py         # Safe exec() wrapper
│   │   └── services/                # Business logic
│   │       ├── contact_service.py
│   │       ├── campaign_service.py
│   │       └── event_service.py     # Event dispatch
│   ├── alembic/
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── tests/
│       ├── conftest.py
│       ├── test_models/
│       ├── test_api/
│       └── test_engine/
├── frontend/                        # Future
└── PROJECT.md
```

---

## Implementation Plan

### Phase 1: Foundation
1. **Project setup** — pyproject.toml, config, database, FastAPI skeleton
2. **SQLAlchemy models** — all 8 tables (see Domain Model)
3. **Alembic** — init + initial migration

### Phase 2: Schemas & Attribute System
1. **Pydantic schemas** — CRUD request/response for all entities
2. **Attribute system** — dynamic validation based on AttributeDefinition; integration into Contact/CampaignMember flows

### Phase 3: CRUD API
1. Contacts API (with dynamic attribute validation)
2. Campaigns API
3. Campaign Members API (add/remove contacts)
4. Attribute Definitions API
5. Rules API (nodes + edges, react-flow compatible)
6. Scheduled Communications API (list, cancel)

### Phase 4: Rule Execution Engine
1. **Execution context** — object model wrapper with read/write attribute access
2. **Script execution** — safe exec() with restricted globals
3. **Condition evaluators** — variable_check with port resolution
4. **Action executors** — all 5 action types
5. **Graph executor** — event dispatch, graph traversal, cycle detection
6. **Event service** — event ingestion API + dispatch to engine

### Phase 5: Testing
1. Unit tests — attribute validation, conditions, actions, scripting
2. Integration tests — full rule execution (graph + event → outcome)
3. API tests — all endpoints

### Phase 6: Frontend (Future)
1. React app scaffold
2. react-flow rule editor (drag-drop, node config panels)
3. Campaign/Contact management pages
4. API integration