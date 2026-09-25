---
title: "Publish your first package"
description: End-to-end flow from local project to first registry release.
---


## 1. Prepare project metadata

Ensure `<name>.bproj` has valid project metadata, at least one target, and explicit dependency declarations.

## 2. Authenticate

Save a publisher API key for this repository (or export `BESKID_PCKG_TOKEN` / `BESKID_PCKG_API_KEY` instead):

```bash
beskid pckg configure --api-key <key>
beskid pckg whoami
```

<Aside type="caution">
Your account must have `Publisher` or `SuperAdmin` role. Authentication will succeed but upload will fail without the right role.
</Aside>

## 3. Pack the artifact

```bash
beskid pckg pack --package my-package --source . --output ./my-package.bpk
```

This assembles the `.bpk` locally:

- manifest validity
- source/package consistency
- deterministic package assembly (and, for library packages, an API-docs pass unless `--skip-docs` is set)

## 4. Upload

```bash
beskid pckg upload my-package --artifact ./my-package.bpk
```

The server assigns the next semantic version (a patch bump over the latest non-yanked version; `0.0.1` on first publish), validates the artifact, and records metadata.

## 5. Verify and consume

```bash
beskid pckg search my-package
beskid pckg details my-package
```

Add the package as a `dependency` block in the consumer's `.bproj` manifest, then let `beskid fetch` / `beskid lock` resolve and materialize it — there is no separate `pckg install` step.

<Aside type="note">
If package is moderated before public availability, wait for approval status in the **pckg registry** publisher workspace. Moderation status is per-package and per-version.
</Aside>

## Troubleshooting

<Aside type="caution">

**"Authentication succeeded but upload failed"** — your account lacks the `Publisher` role. Contact a registry admin.

**"No deterministic entrypoint"** — pack can't resolve the project entrypoint. Ensure a `.bproj` manifest exists, or exactly one `.bd` file at the source root.

**"Checksum mismatch"** — the `--checksum-sha256` flag doesn't match the artifact. Regenerate: `shasum -a 256 package.bpk`.

</Aside>

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview and concepts
- [The pckg CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — tutorial walkthrough of `beskid pckg`
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — generated API docs for pckg ingestion
- [Package public surface](/book/19-public-api-that-survives-review/package-public-surface/) — what registry consumers see
