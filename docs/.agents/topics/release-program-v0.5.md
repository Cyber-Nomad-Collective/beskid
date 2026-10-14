# Release program v0.5

The v0.5 release line and the standing authorizations the maintainer gave
agents for it. At the time of writing (2026-10-14) the compiler is pinned at
0.5.3 and the OpenSpec change for 0.5.4 language fixes has landed.

## Authorization (upstream maintainer, for the v0.5 program)

Agents working for the maintainer on v0.5 may, without asking each time:

- make necessary implementation, test and documentation changes inside the
  repositories;
- make changes to isolated build caches;
- keep working through overnight decisions, recording each one as a ruling
  that fits existing conventions.

They must still ask before:

- pushes and merges;
- publishing;
- destructive operations;
- credential changes;
- changes to external services.

This authorization belongs to the maintainer's sessions. It does not carry over
to sessions for other people.

## Where the program is documented

- Book: `site/website/src/content/docs/book/11-fibers-cheaper-than-threads/v0-5-foundations-roadmap.md`
- Research: `docs/research/2026-09-19-v05-*.md` and later files
- Release notes: `CHANGELOG.md` and the blog in `site/website`
- Delivery status: the Tracker

## Historical note

An earlier `CLAUDE.md` pointed agents to a handoff file outside the repository
(`~/.claude/handoffs/codex-current-tasks-2026-09-22.md`) and told them to keep
its dirty worktrees. That file exists only on the maintainer's machine.
