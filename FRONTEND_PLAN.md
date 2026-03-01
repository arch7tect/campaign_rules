# Frontend Implementation Plan

## Context

The backend is complete (FastAPI, SQLAlchemy, rule engine with 55 tests passing). Now building the React frontend with: management pages for campaigns/contacts/members + a visual rule editor using react-flow.

## Stack

React 18 + TypeScript + Vite + React Router v6 + Tailwind CSS + shadcn/ui + @xyflow/react (react-flow v12) + TanStack Query

## Backend Fix Required

`backend/app/api/rules.py` `update_rule_graph` -- edges use `edge_data.source_node_id` / `target_node_id` directly but since graph replacement recreates all nodes, the frontend cannot know new DB IDs. Fix: remap through `temp_to_real` dict (already built but unused). Edges will use array indices (0, 1, 2...) matching node order.

---

## Phase 1: Scaffold

Create `frontend/` with Vite + React + TS. Install deps. Configure:
- `vite.config.ts` -- proxy `/api` and `/health` to `http://localhost:8000`
- Tailwind + shadcn/ui init
- shadcn components: Button, Input, Table, Dialog, Sheet, Tabs, Select, Badge, Textarea, Label, Card

Files:
```
frontend/
  vite.config.ts
  tsconfig.json
  src/
    main.tsx          # QueryClientProvider + RouterProvider
    App.tsx           # Sidebar layout + <Outlet/>
    index.css         # Tailwind imports
```

## Phase 2: Types + API Client + Hooks

**`src/types/`** -- TypeScript types mirroring backend Pydantic schemas:
- `campaign.ts` -- Campaign, CampaignCreate, CampaignUpdate, CampaignStatus
- `contact.ts` -- Contact, ContactCreate, ContactUpdate
- `campaign-member.ts` -- CampaignMember, MemberStatus
- `attribute.ts` -- AttributeDefinition, DataType, OwnerType, AttributeConstraints
- `rule.ts` -- Rule, RuleNode, RuleEdge, RuleNodeCreate, RuleEdgeCreate, RuleGraphUpdate, NodeType
- `rule-configs.ts` -- ValueRef, ValueSource, ComparisonOperator, VariableCheck, VariableCheckConditionConfig, EventConfig, ActionConfig (discriminated unions), FieldAssignment
- `communication.ts` -- ScheduledCommunication, CommunicationStatus
- `event.ts` -- EventPayload

**`src/api/`** -- typed fetch wrapper + resource modules:
- `client.ts` -- base `api.get/post/patch/put/delete` with error handling
- `campaigns.ts`, `contacts.ts`, `campaign-members.ts`, `attributes.ts`, `rules.ts` (includes `putGraph`), `communications.ts`, `events.ts`

**`src/hooks/`** -- TanStack Query wrappers per resource:
- `use-campaigns.ts`, `use-contacts.ts`, `use-campaign-members.ts`, `use-attributes.ts`, `use-rules.ts` (includes `useRuleGraphMutation`), `use-communications.ts`

## Phase 3: Routing + Management Pages

**Routes:**
```
/                                -> redirect to /campaigns
/campaigns                       -> CampaignListPage
/campaigns/:id                   -> CampaignDetailPage
/campaigns/:id/rules/:ruleId     -> RuleEditorPage (full-screen, no sidebar)
/contacts                        -> ContactListPage
/contacts/:id                    -> ContactDetailPage
```

**Pages:**

`CampaignListPage` -- table with name, status badge, created date. Create/edit via dialog with CampaignForm.

`CampaignDetailPage` -- header with name + status. Four tabs:
1. Rules -- list with name, is_active toggle, "Edit" link to editor. Create rule button.
2. Members -- table, "Add Member" dialog to search/select contacts.
3. Attributes -- attribute definitions for this campaign. Create/edit dialog.
4. Communications -- scheduled communications list with cancel button.

`ContactListPage` -- table with name, email, phone. Create/edit dialog.

`ContactDetailPage` -- contact info card + dynamic attributes + memberships table.

**Shared components:**
- `components/layout/AppSidebar.tsx` -- nav links (Campaigns, Contacts)
- `components/layout/PageHeader.tsx` -- title + breadcrumbs
- Form/table components per resource under `components/{resource}/`

## Phase 4: Rule Editor (core complexity)

### Data mapping (`src/editor/utils/serialization.ts`)

**Load** (backend -> react-flow): `RuleNode.id` -> string node ID, `position_x/y` -> position, `node_type` -> react-flow type, `node_subtype + config` -> `data`. Edges map `source_node_id` -> string source, `source_port` -> sourceHandle.

**Save** (react-flow -> backend): Build `idToIndex` map (react-flow node ID -> array index). Serialize nodes to `RuleNodeCreate[]`, edges to `RuleEdgeCreate[]` using array indices for source/target IDs.

### Custom nodes (`src/editor/nodes/`)

Three react-flow node types registered as `{ event: EventNode, condition: ConditionNode, action: ActionNode }`:

- `BaseNode.tsx` -- shared wrapper: color-coded header (green/yellow/blue), title, selection ring
- `EventNode.tsx` -- no input handle, one output ("default"). Shows event type label; custom events show event_name.
- `ConditionNode.tsx` -- input handle + dynamic output handles: one per `check.port_name` + "else" if enabled. Handles update when config changes.
- `ActionNode.tsx` -- input + one output ("default"). Shows action type label + brief summary.

### Node palette (`src/editor/NodePalette.tsx`)

Left sidebar listing draggable items grouped by category (Events: 5 subtypes, Conditions: 1, Actions: 5). On drop: create node with temp UUID, appropriate type/subtype, default empty config.

### Config panel (`src/editor/ConfigPanel.tsx`)

Right-side Sheet opening on node click. Renders subtype-specific form + delete button. Updates `node.data.config` via `setNodes` functional update.

### Config forms (`src/editor/config-forms/`)

- `EventConfigForm.tsx` -- event_type display; for "custom": event_name input
- `ConditionConfigForm.tsx` -- list of checks (add/remove), each with left ValueRefEditor, operator select (15 ops), right ValueRefEditor, port_name input. Checkbox for has_else_port.
- `ValueRefEditor.tsx` -- reusable: source selector (constant/attribute/expression) + conditional fields. Attribute mode fetches definitions from API for dropdown.
- `ModifyModelForm.tsx` -- assignment list: object_type select, attribute_name select, value ValueRefEditor
- `ScheduleCommunicationForm.tsx` -- channel input, agent_params JSON editor, time expression inputs
- `RunScriptForm.tsx` -- monospace textarea for Python code
- `TriggerEventForm.tsx` -- event_name input
- `CancelCommunicationsForm.tsx` -- info text only

### Main editor (`src/editor/RuleFlowEditor.tsx`)

Full-screen layout: NodePalette (left) | ReactFlow canvas (center) | ConfigPanel (right, conditional).
- Loads rule via `useRule(ruleId)`, converts to react-flow state
- Save button serializes flow state -> `PUT /api/rules/{id}/graph`
- Connection validation: no edges into event nodes, no self-loops
- Toolbar: save, back button, rule name/active toggle

## Phase 5: Polish

- Vite proxy for dev (avoid CORS)
- Unsaved changes warning via `useBlocker`
- Edge validation in `isValidConnection`
- Error boundaries and loading states

---

## Build order

1. Scaffold (Phase 1)
2. Types + API + hooks (Phase 2)
3. Backend fix for `temp_to_real` edge remapping
4. Management pages -- campaigns first, then contacts (Phase 3)
5. Rule editor -- serialization utils first, then nodes, then palette, then canvas, then config forms (Phase 4)
6. Polish (Phase 5)

## Verification

1. `cd frontend && npm run dev` -- app loads at localhost:5173
2. Create campaign, contacts, members via UI
3. Create rule, open editor, drag nodes, connect edges, configure, save
4. Fire event via API (`POST /api/events/`), verify rule executed
5. Reload editor page -- saved graph loads correctly
