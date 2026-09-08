---
title: "beskid pckg"
description: "Package registry and publishing operations (pckg backend)."
---

Dispatches to the **pckg** HTTP client: authentication, catalog search and details, `.bpk` pack and upload, version download, yank/unyank, and related registry workflows (project dependency resolution stays on **`beskid fetch`** / **`beskid lock`**).

Use the `beskid pckg` root command:

```bash
beskid pckg --help
```

## Automatic docs on pack (library packages)

For ordinary **library** projects (`project.type` omitted or `Host`), `beskid pckg pack` (via the **beskid** CLI) generates API docs before creating the `.bpk` artifact:

- writes Markdown and `api.json` to `<source>/.beskid/docs/` (for example `index.md`)
- includes those files in the published artifact (paths under `.beskid/docs/` are allowed by the registry)

The package browser lists Markdown from:

- `docs/**/*.md` in the artifact
- optional root `README.md` (from `readme.md` at package root, `readme = "path"` in the project's `.bproj` manifest, or an explicit on-disk `README.md`)
- **`.beskid/docs/**/*.md`** (same layout as Beskid pack output)

You can also ship hand-written docs under a top-level `docs/` directory in the package source; those paths are packed as usual and appear alongside generated files.

Entrypoint resolution for generation:

1. the single `<source>/*.bproj` project manifest (preferred)
2. `<source>/main.bd`, `<source>/src/main.bd`, or `<source>/index.bd`
3. otherwise, exactly one `.bd` file under `<source>`

If no deterministic entrypoint can be inferred, packing fails with an explicit error.

## Template packages (`project.type = Template`)

When the project `.bproj` declares **`type = Template`**, pack uses the **template profile**:

- sets root `package.json` **`packageKind: "template"`**
- reads the authoring manifest from **`.beskid/template.json`** and writes it as
  artifact-root **`template.json`** (schema **`beskid.template.v1`**)
- copies a **`template`** summary (`shortName`, `identity`, `tags`) from that manifest into `package.json`
- **does not** run `beskid doc` or embed **`.beskid/docs/api.json`**

Authoring and registry rules: [Template packages](/docs/standard/tooling/project-scaffolding/template-packages/). User workflows: [Project scaffolding](/book/reference/projects/scaffolding/).

## Pack (`beskid pckg pack`)

Builds a `.bpk` zip from a package source tree.

Typical flags:

- `--package <id>` — package id written into the generated root `package.json` inside the artifact
- `--source <dir>` — directory to pack (defaults to `.`)
- `--output <path.bpk>` — artifact path to create
- `--version <semver>` (optional) — if omitted, the CLI picks the next patch over the higher of `package.json`’s version (when present) and the last version recorded for this package in the version state file (see below); if provided, it must be strictly greater than that auto-resolved version
- `--version-state-file <path>` (optional) — JSON map of package id → last packed version; default is `<source>/.beskid/pckg-version-state.json`
- `--package-kind <auto|tool>` — profile override; default `auto`
- `--skip-docs` — skip generation but still validate and include prepared API docs

On success the CLI prints a line of the form `Resolved package version: <semver>` (the version embedded in the packed `package.json`).

## Publishing a workspace

The registry accepts one canonical `.bpk` artifact per package; it does not
accept workspace ZIP bundles. A workspace publisher (for example the corelib
release workflow) must:

1. classify the publishable workspace members and resolve their versions;
2. pack and validate every member before the first registry mutation;
3. create or update each package through `POST /api/packages`;
4. upload each member through `POST /api/packages/<name>/versions` with the
   artifact's version, SHA-256 checksum, and `.bpk` bytes.

Workspace metadata controls inventory and ordering in the publisher only. Each
artifact must contain registry dependencies rather than `path` or `workspace`
sources. The server applies the same immutable-version and artifact validation
rules to every member; there is no separate workspace publication contract or
rollback envelope.

## Upload (`beskid pckg upload`)

Publishes an existing `.bpk` to an existing registry package
(`POST /api/packages/<package>/versions`).

Usage shape:

```bash
beskid pckg upload <package> --artifact path/to/package.bpk
```

The CLI does **not** accept a separate `--version` flag. It reads the version
from the validated artifact-root `package.json` and sends that exact value with
the checksum and artifact bytes. Packing or the release version plan therefore
owns version selection; the registry rejects a different artifact at an
already-published package/version coordinate.

Optional upload flags:

- `--checksum-sha256 <hex>` — must match the artifact when provided

On success, when the API returns version details, the CLI prints:

- `PCKG_PUBLISHED_VERSION=<semver>` — stable line for scripts and CI (for example the corelib publish script parses this)
- a human-readable summary including the published version, checksum, size,
  and timestamps

Other subcommands that target a specific release (`download`, `yank`, `unyank`) still take `--version` because they refer to an already-published version.

## Shared client options

These apply to all `beskid pckg` subcommands (see `beskid pckg --help` for the full list):

- `--base-url <url>` — pckg HTTP root (also `BESKID_PCKG_URL`)
- `--bearer-token` or `--api-key` — authentication (also `BESKID_PCKG_TOKEN` / `BESKID_PCKG_API_KEY`); otherwise the CLI can load a saved publisher key from `--config-file` (default `.beskid/pckg/repositories.json`, written by `beskid pckg configure`)
- `--timeout-secs <seconds>` — request timeout; default `30`
- `--config-file <path>` — repository config; default `.beskid/pckg/repositories.json`
- `-v`, `--verbose` — print connection, authentication-presence, and timing diagnostics

The default `--base-url` is `https://pckg.beskid-lang.org`. `--bearer-token` and `--api-key` conflict.

## Complete operation reference

| Operation | Arguments and flags |
| --- | --- |
| `beskid pckg pack` | Required `--package` and `--output`; optional `--version`, `--source` (default `.`), `--version-state-file`, `--package-kind`, and `--skip-docs` |
| `beskid pckg upload <PACKAGE>` | Required `--artifact`; optional `--checksum-sha256` |
| `beskid pckg configure` | Required `--api-key`; optional `--repository-url` (defaults to the root `--base-url`) |
| `beskid pckg list` | No operation-specific arguments |
| `beskid pckg search <QUERY>` | Required free-text query |
| `beskid pckg details <ID_OR_NAME>` | Required package identifier or name |
| `beskid pckg versions <PACKAGE>` | Required package name |
| `beskid pckg download <PACKAGE>` | Required `--version` and `--output` |
| `beskid pckg yank <PACKAGE>` | Required `--version` |
| `beskid pckg unyank <PACKAGE>` | Required `--version` |
| `beskid pckg whoami` | No operation-specific arguments |

## Discovering commands

Run:

```bash
beskid pckg --help
```

for the live subcommand tree and flags.

## Conceptual documentation

For auth flows, lockfiles, and publish semantics, see the book chapter [Packages without npm trauma](/book/18-packages-without-npm-trauma/).

## Examples

```bash
beskid pckg whoami
```

Pack then upload (after `beskid pckg configure` or with env auth):

```bash
beskid pckg pack --package my-lib --source ./my-lib --output ./my-lib.bpk
beskid pckg upload my-lib --artifact ./my-lib.bpk
```

## See also

- [The pckg CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — historical registry command flow and concepts
- [Publish a package](/docs/packages/publish/) — verified workflow
- [Consume a package](/docs/packages/consume/) — resolve, lock, and materialize a registry dependency
- [Credentials and recovery](/docs/packages/credentials-and-recovery/) — protect and rotate publisher credentials
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview and concepts
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — generated API docs packed with `.bpk`
- [Package public surface](/book/19-public-api-that-survives-review/package-public-surface/) — what registry consumers see
- [CLI command reference](/book/reference/cli/command-reference/) — all subcommands

[← Back to CLI command reference](/book/reference/cli/command-reference/)
