---
title: "beskid pckg"
description: "Package registry and publishing operations (pckg backend)."
---

Dispatches to the **pckg** HTTP client: authentication, catalog search and details, `.bpk` pack and upload, version download, yank/unyank, and related registry workflows (project dependency resolution stays on **`beskid fetch`** / **`beskid lock`**).

## Automatic docs on pack (library packages)

For ordinary **library** projects (`project.type` omitted or `Host`), `beskid pckg pack` (via the **beskid** CLI) generates API docs before creating the `.bpk` artifact:

- writes Markdown and `api.json` to `<source>/.beskid/docs/` (for example `index.md`)
- includes those files in the published artifact (paths under `.beskid/docs/` are allowed by the registry)

On **pckg**, the in-browser documentation browser lists Markdown from:

- `docs/**/*.md` in the artifact
- optional root `README.md` (from `readme.md` at package root, `readme = "path"` in `Project.proj`, or an explicit on-disk `README.md`)
- **`.beskid/docs/**/*.md`** (same layout as Beskid pack output)

You can also ship hand-written docs under a top-level `docs/` directory in the package source; those paths are packed as usual and appear alongside generated files.

Entrypoint resolution for generation:

1. `<source>/Project.proj` (preferred)
2. `<source>/main.bd`, `<source>/src/main.bd`, or `<source>/index.bd`
3. otherwise, exactly one `.bd` file under `<source>`

If no deterministic entrypoint can be inferred, packing fails with an explicit error.

## Template packages (`project.type = Template`)

When `Project.proj` declares **`type = Template`**, pack uses the **template profile**:

- sets root `package.json` **`packageKind: "template"`**
- includes **`.beskid/template.json`** in the artifact (required at pack time; schema **`beskid.template.v1`**)
- copies a **`template`** summary (`shortName`, `identity`, `tags`) from that manifest into `package.json`
- **does not** run `beskid doc` or embed **`.beskid/docs/api.json`**

Authoring and registry rules: [Template packages](/platform-spec/tooling/project-scaffolding/template-packages/). User workflows: [Project scaffolding](/book/reference/projects/scaffolding/).

## Pack (`beskid pckg pack`)

Builds a `.bpk` zip from a package source tree.

Typical flags:

- `--package <id>` — package id written into the generated root `package.json` inside the artifact
- `--source <dir>` — directory to pack (defaults to `.`)
- `--output <path.bpk>` — artifact path to create
- `--version <semver>` (optional) — if omitted, the CLI picks the next patch over the higher of `package.json`’s version (when present) and the last version recorded for this package in the version state file (see below); if provided, it must be strictly greater than that auto-resolved version
- `--version-state-file <path>` (optional) — JSON map of package id → last packed version; default is `<source>/.beskid/pckg-version-state.json`

On success the CLI prints a line of the form `Resolved package version: <semver>` (the version embedded in the packed `package.json`).

## Workspace publish (registry API)

For multi-package workspaces (for example **corelib** with `foundation`, `runtime`, `compiler_sdk`, and aggregate `corelib`), the registry exposes:

`POST /api/workspaces/publish`

Multipart fields:

- `artifact` (required) — ZIP whose root contains `Workspace.proj` and each member’s source tree (`Project.proj`, `src/`, optional `package.json`)
- `versionBump` (optional `patch` | `minor` | `major`, default `patch`) — registry-assigned semver bump applied to **every** member package

The server publishes each member as a separate package version, rewrites workspace **path** dependencies to **registry** references using the versions assigned in that upload, and rejects published `package.json` dependencies that still use `path` or `workspace` sources. Optional root `workspace.package.json` (`schema: beskid.workspace.package.v1`) and per-member `package.json` `pckg.configuration` / `pckg.overrides` supply publish metadata; `Workspace.proj` `override` blocks pin external dependency versions.

CLI support for bundling and calling this endpoint is planned; CI can call the HTTP API directly until then.

## Upload (`beskid pckg upload`)

Publishes an existing `.bpk` to the registry (`POST /api/packages/<package>/publish`).

Usage shape:

```bash
beskid pckg upload <package> --artifact path/to/package.bpk
```

The CLI does **not** accept a `--version` flag and does **not** send a multipart `version` field. The **pckg** server assigns the next semantic version for that package (by default a **patch** bump over the latest non-yanked published version; first publish uses `0.0.1`). The artifact’s internal `package.json` version may differ from the registry-assigned publish version; the server validates the artifact accordingly.

Optional upload flags:

- `--checksum-sha256 <hex>` — must match the artifact when provided
- `--manifest-json <string>` — forwarded as optional `manifestJson` form metadata (the server still persists manifest material from the artifact)

On success, when the API returns version details, the CLI prints:

- `PCKG_PUBLISHED_VERSION=<semver>` — stable line for scripts and CI (for example the corelib publish script parses this)
- a human-readable summary including `version: <semver> (registry-assigned)` plus checksum, size, and timestamps

Other subcommands that target a specific release (`download`, `yank`, `unyank`) still take `--version` because they refer to an already-published version.

## Shared client options

These apply to all `beskid pckg` subcommands (see `beskid pckg --help` for the full list):

- `--base-url <url>` — pckg HTTP root (also `BESKID_PCKG_URL`)
- `--bearer-token` or `--api-key` — authentication (also `BESKID_PCKG_TOKEN` / `BESKID_PCKG_API_KEY`); otherwise the CLI can load a saved publisher key from `--config-file` (default `.beskid/pckg/repositories.json`, written by `beskid pckg configure`)
- `--timeout-secs`, `--verbose`

## Discovering commands

Run:

```bash
beskid pckg --help
```

for the live subcommand tree and flags.

## Conceptual documentation

For auth flows, lockfiles, and publish semantics, see the site guide [Package Client CLI](/packages/client-cli/).

## Examples

```bash
beskid pckg whoami
```

Pack then upload (after `beskid pckg configure` or with env auth):

```bash
beskid pckg pack --package my-lib --source ./my-lib --output ./my-lib.bpk
beskid pckg upload my-lib --artifact ./my-lib.bpk
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
