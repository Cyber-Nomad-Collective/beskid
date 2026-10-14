# Scope: OpenSpec standard

The Beskid Standard: the only normative definition of the language, toolchain
and platform. Lives in `openspec/` at the root (not a submodule).

## What is normative

- `openspec/specs/` (one directory per capability, about 200) together with
  `openspec/catalog.json` are the sole authority.
- `openspec/catalog.json` is generated. It records identity, requirement ids,
  source hashes and provenance.
- Everything else is informative: the Book, Beskid Docs, `GLOSSARY.md`,
  `GUIDE.md`, `AGENTS.md` and this directory.

## Where it is published

- `site/website` is the single public Docs surface and links to the standard at
  `/docs/standard/`.
- Legacy `/platform-spec` paths redirect there. The old `site/spec-content`
  corpus is removed.

## Change workflow

1. Write an OpenSpec change in `openspec/changes/` before code changes any
   observable behaviour.
2. Implement, then test.
3. Archive the change so its deltas land in `openspec/specs/`.

## Commands

| Task | Command |
| --- | --- |
| Rebuild the catalog | `pnpm openspec:catalog` |
| Validate standard, Book traceability, layouts, strict OpenSpec | `pnpm openspec:validate` |
| CI gate | `scripts/ci/openspec-gate.sh` |

## Validation traps

- The catalog lists several root documents (`AGENTS.md`, `GLOSSARY.md`,
  `GUIDE.md` and others) with a `sourceHash`. After editing any of them, run
  `pnpm openspec:catalog`, or validation fails on the stale hash.
- `validate-standard` hard-fails when a spec still carries the archive
  placeholder "TBD - created by archiving change ... Update Purpose after
  archive."
- Files under `docs/.agents/` are not in the catalog.

## Promoting provisional capabilities

When a provisional capability becomes standard, it needs real SHALL
requirements and scenarios through an OpenSpec change, not stub text. Leave
taxonomy hubs and empty governance or design-model stubs provisional until
they have leaf obligations. (Upstream maintainer preference.)

## Relation to the Tracker

OpenSpec says what the rules are; the Tracker says when they ship. See
[tracker-and-nexus.md](tracker-and-nexus.md).
