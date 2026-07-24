---
title: "SQLite Is the Source of Truth. GitHub Issues Is the Mirror."
description: "v0.4 made the Beskid tracker a SQLite database — the real record of what shipped. GitHub Issues sync is scoped to active version and bugs only. If you want to know what's Done and what's Not Yet, you query the tracker."
date: 2026-06-02
blogStatus: released
release: v0.4
---

Before v0.4, the Beskid tracker's state was scattered. Some tasks lived in GitHub Issues. Some in GitHub project boards. Some in the maintainer's head. Some in a spreadsheet that was last updated three weeks ago. If you wanted to know what shipped in v0.3, you assembled it from four sources and prayed.

v0.4 ended that. The tracker became a SQLite database, and the SQLite database became the authority.

## Why a local database beats a cloud platform

This sounds like the wrong call. GitHub Issues has a great API. Project boards have kanban views. GitHub is always available, always backed up, always maintained by someone else. Why replace that with a file on disk?

Because a local database is a contract. The schema is explicit: tasks have a version, a status, a kind, a description, and provenance fields that link back to commits and maintainer narratives. The status enum is `Backlog`, `InProgress`, `Done`, `Deferred` — four values, no drift. The version field is a foreign key into a versions table. The provenance field stores commit SHAs and maintainer narrative paths. Nothing drifts because nothing can drift — the schema is checked at compile time, the queries are checked at compile time, the migration path is checked at compile time.

GitHub Issues has none of that. A label changes meaning when someone renames it from `bug` to `type/bug` and doesn't update the query. A column gets renamed on the project board and every saved filter breaks. A closed issue turns out to be half-done but nobody remembers because "closed" doesn't mean "verified" — it means someone clicked the button.

The SQLite database does not forget and does not drift. It is a single file. You can version it in git alongside the code. You can diff it to see what changed between releases. You can query it with SQL and know the answer is correct — not "probably correct based on whatever the GitHub API returned this time."

This is the same philosophy that drives the platform spec: trust nothing, verify everything. A cloud platform is someone else's database. You trust their schema, their API, their interpretation of "closed." A SQLite file is your database. You define the schema. You write the queries. You own the truth.

## The scoped GitHub sync

The tracker still syncs to GitHub Issues, but the sync is scoped: active version tasks and bugs only. The closed issues, the historical tasks, the backlog speculation — those live exclusively in the SQLite database. GitHub Issues is a window into what is happening right now, not the record of what happened. It is a convenience for contributors who already live in GitHub, not a substitute for the project's memory.

The sync is one-directional for anything that originates in the tracker. If a task is marked Done in the SQLite database, the corresponding GitHub issue is closed. If someone reopens the GitHub issue, the sync ignores it. GitHub never wins a conflict. The SQLite database is the source of truth.

This scope decision is intentional. GitHub sync for everything — archive, backlog, deferred, historical — would be a maintenance burden with no benefit. Nobody needs to browse v0.1's closed issues on GitHub. They need to browse them in the tracker, where the version filter works and the status is authoritative.

## How the tracker feeds the blog

The "36 Done, 11 In Progress, 5 Backlog" counts that appear in release posts are not hand-counted. They are queried:

```sql
SELECT status, COUNT(*) FROM tasks
WHERE version = 'v0.4'
GROUP BY status;
```

That query runs against the SQLite database. The kanban board runs the same query. The version log runs the same query. They are not maintained separately — no separate spreadsheet, no separate dashboard, no manual reconciliation. One database, one query, one truth.

This might sound obvious. It is not. Most projects maintain at least two representations of their status: the issue tracker and the release notes, which are written by hand and drift from the tracker immediately. Beskid's blog posts quote the tracker. The tracker is the record. The blog is the window.

## The kanban UX

v0.4 also shipped the kanban surface: structural tabs (Backlog, In Progress, Done, Deferred), a settings shell with a left nav tree, and task dialogs that are roughly 70% form and 30% preview. The kind of UI work that takes weeks and looks like it took hours.

Every task has a dialog with fields for the version, status, kind, description, and provenance links. The form is the database schema rendered as input elements. If you add a column to the tasks table, the form gets a new field. Nothing drifts because the form is generated from the schema — the same philosophy as the spec site generating documentation from the platform spec YAML.

## The architecture

The tracker is a Rust web service with a SQLite backend. It exposes a REST API that the kanban UI calls. It runs the GitHub sync as a background task — polling for new issues, updating statuses, never overwriting tracker-authored data. The database file lives in the `beskid_tracker` repository, versioned alongside the code that reads it.

Contrast this with enterprise projects where the "source of truth" is whichever Jira board got updated last, the GitHub project board has a different set of columns, and the spreadsheet the PM sent on Friday contradicts both. That is not a process problem. It is an architecture problem. When truth lives in three places, there is no truth — there is only the conflict resolution meeting you have every Monday.

Beskid's tracker is small, but it is honest, and it will scale because the architecture does not depend on anyone remembering the process. The schema enforces the process. The queries produce the reports. The blog quotes the queries. No reconciliation required.

Next: [Nexus, Grafana, and the Observability You Don't Think About Until Production Is Down](/blog/v0-4-03-nexus-observability/)
