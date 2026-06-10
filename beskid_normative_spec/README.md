# Beskid normative specification

Version-controlled normative platform specification for [Beskid](https://beskid-lang.org).

This repository is the **source of truth** for spec content. Each node is a directory under `platform-spec/` with:

| File | Purpose |
|------|---------|
| `node.json` | Metadata (type, title, status, ADR fields) |
| `content.md` | Normative Markdown body (`##` sections) |
| `layout.json` | Reader layout (widget grid) |
| `comments.json` | Review comments (optional) |

Workspace manifest: `spec.json` (node type registry, allowed nesting, architecture graph ids).

## Status workflow

- `draft` — work in progress (default for new nodes)
- `review` — ready for maintainer review
- `published` — normative on [spec.beskid-lang.org](https://spec.beskid-lang.org)

## CLI

From the superrepo (with `@beskid/spec-cli` linked):

```bash
cd beskid_normative_spec
spec validate
spec new node -t Domain --slug compiler --title "Compiler"
spec serve --port 8460
spec auth login --token "$GITHUB_TOKEN"
spec repo push --slug platform-spec/compiler
```

## Validation CI

Pull requests run `spec validate` via GitHub Actions.

## Submodule

This repo is included in the Beskid superrepo as `beskid_normative_spec/`.
