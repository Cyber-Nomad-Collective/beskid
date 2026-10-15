# Scope: pckg

The Beskid package registry at <https://pckg.beskid-lang.org>.

## Parts

- **Registry service:** Rust, in `compiler/crates/beskid_pckg_server/`.
  AGPL-3.0-only.
- **Web app:** TanStack, in `beskid_sites/apps/pckg/`.
- **Client:** the `beskid` CLI's package commands, in the compiler's
  `beskid_pckg_*` crates.
- **Local stack:** the `pckg/` submodule carries Docker Compose for local
  development with PostgreSQL (`cd pckg && podman compose up --build -d`).
- Browser identity is delegated to the shared auth hub (`site/auth/`).

## History

The legacy .NET registry and the duplicate web clients are removed. Do not
reintroduce them or bridge to them.

## Publishing corelib and templates

`scripts/ci/corelib-publish.sh` packs and publishes the production corelib
closure and all first-party templates to pckg. `--dry-run` validates every
artifact without secrets or registry changes. A real publish is an external
action and needs the owner's approval.

## Related

- Book chapter 18, "Packages without npm trauma".
- Domain notes for the pckg migration were kept outside the repository by
  earlier sessions (`~/.agents/knowledge/pckg-*.md` on the maintainer's machine).
