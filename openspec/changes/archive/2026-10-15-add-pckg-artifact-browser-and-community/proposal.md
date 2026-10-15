## Why

The pckg registry stores a fully validated `.bpk` artifact for every version,
but the website could only read a filtered subset of it (`src/`, `docs/`,
`README.md`) through separate routes, served `.beskid/docs/metadata.json` as
"structured documentation" although `beskid pckg pack` emits
`.beskid/docs/api.json`, and linked package pages to a NodeBB category URL the
browser guessed from the package name. No NodeBB category was ever created, so
every "Discuss" button was a dead link, and the generated API reference was
never shown.

## What Changes

- **ADD** registry routes that expose the whole verified artifact as a file
  tree and serve one file at a time with text, binary and size guards.
- **MODIFY** the structured-documentation route to return the README and the
  validated `.beskid/docs/api.json` document; the undocumented `metadata`
  field is removed.
- **ADD** registry-owned NodeBB community linking: one discussion category per
  public package, created on package creation under a configured parent
  category, persisted as the category identity, served with its public URL,
  live counters, and an administrator reconcile route. Without configuration
  no community surface exists. The browser never derives community URLs.
- **MODIFY** the website documentation surface to render `api.json` as a
  reference (module tree, per-item pages with declaration, parameters,
  returns, remarks, examples, member tables, outline).

## Impact

- `compiler/crates/beskid_pckg_server`, `beskid_pckg_artifacts`,
  `beskid_pckg_store` (migration `0012_add_package_community`),
  `beskid_pckg_contract` (`community` on package summaries).
- `beskid_sites/apps/pckg` routes `/packages/$name/files` and `/docs/$package`.
- Compatibility: the `docs/structured` payload shape changes and the browser
  no longer shows a discussion link for packages the registry has not linked.
  Beskid has no external registry consumers yet, so no migration path or
  legacy acceptance is kept; reverting restores the previous routes only.
- Legacy URL migration: none. Public standard routes are unchanged.
