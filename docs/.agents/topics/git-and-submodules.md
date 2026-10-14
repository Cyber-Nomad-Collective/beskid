# Git and submodules

How the superrepo works mechanically, and the rules for branches, commits and
merges.

## The superrepo

- The root repository holds the standard, docs site, scripts and CI. Most
  products are git submodules (11 at the time of writing), each its own
  repository with its own status, tests, instructions and change log.
- `compiler/` and `pckg/` use relative URLs (`../beskid_compiler.git`,
  `../beskid_pckg.git`). They resolve only when your remote has those
  repositories next to it.
- `compiler/` has a nested submodule (`corelib`). Always use `--recursive`.
- Before editing inside a submodule, run `git submodule status` and look at that
  submodule's own `git status`.

## Getting the submodules

| Situation | Command |
| --- | --- |
| Full setup (submodules + root `pnpm install`) | `./scripts/setup-environment.sh` |
| Only some submodules | `./scripts/setup-environment.sh --submodules <path>...` |
| Skip the JS install | `BESKID_SKIP_JS_INSTALL=1 ./scripts/setup-environment.sh` |
| Plain git | `git submodule update --init --recursive` |
| Interactive wizard | `just setup` |

Checkout uses git submodules, not Google's `repo` tool.

## Day-to-day submodule work

- lazygit with the Beskid config (`scripts/lazygit/config.yml`): `U` updates all
  submodules; `P` commits and pushes recursively through
  `scripts/git-commit-push-recursive.sh`.
- Toolchain installation for submodules is driven by `scripts/install-deps.sh`
  and `repo-deps.json` (`just deps-check`, `just deps-install`).
- `scripts/submodule-guard.sh` and `.githooks/` guard against accidental
  pointer changes; install the hooks with `scripts/install-githooks.sh`.

## Commits

- No `Co-authored-by` trailers. This project rule overrides any tool default
  that adds one.
- Update `CHANGELOG.md` for notable changes. Update `GLOSSARY.md` when a
  canonical term changes.
- Never stage or commit unrelated changes, and never commit knowledge files
  kept outside the repository.
- Run focused tests, strict OpenSpec validation and GitNexus change detection
  before a commit (see [gitnexus.md](gitnexus.md)).

## Branches and merges (upstream maintainer preferences)

- Keep the root and the submodules on `main` with clean merges. Fix merge noise
  instead of leaving local branches that diverge.
- An agent pushes only its own branch. It does not merge into `main` unless the
  owner explicitly authorizes the merge for that task.
- Verify builds and gates locally until they pass before pushing.

## In sessions for contributors

A contributor may have stricter rules, for example "never commit". Follow the
stricter rule. See [../people/working-with-sett.md](../people/working-with-sett.md).
