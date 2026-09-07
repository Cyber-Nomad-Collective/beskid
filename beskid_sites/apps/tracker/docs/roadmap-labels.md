# Tracker metadata and GitHub bugs

The Tracker SQLite database is the only source of truth for roadmap tasks. Task status, priority, delivery version, workstream, ownership, subtasks, and OpenSpec relations are stored in the normalized `tracker_*` tables and never synchronized with GitHub.

## GitHub boundary

GitHub Issues are used only for bugs. An inbound issue must carry the exact `bug` label; every other issue event is ignored. Outbound entries can only use the `bug` entity type, and the schema migration removes historical task links and task outbox rows.

## Task metadata

| Tracker field | Meaning |
|---|---|
| `status_column` | `Backlog`, `In Progress`, or `Done` |
| `priority` | `high`, `medium`, or `low` |
| `version_id` | Delivery version owning the task |
| `workstream` | Optional catalog workstream |
| `spec_approval` | `pending` or `approved` |
| `tracker_task_subtasks` | Ordered tracker-native checklist |
| `tracker_task_spec_relations` | Typed links to stable OpenSpec catalog entries |

Task APIs and UI mutations identify a task with `{ versionId, taskId }`. GitHub issue numbers are not task identifiers.

## OpenSpec relations

Relations use `implements`, `depends-on`, `tracks`, `extends`, or `validates`. The catalog adapter reads stable identifiers and revisions from `/api/v1/catalog` or `/openspec/catalog.json`; legacy navigation JSON is compatibility-only.
