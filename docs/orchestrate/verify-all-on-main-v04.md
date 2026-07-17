# verify-all-on-main (v0.4)

**Status:** skeleton — fill when production and matrix gates are green on `main`.

Evidence template mirroring v0.3 closure at [`aba4331`](https://github.com/Cyber-Nomad-Collective/beskid/commit/aba4331). v0.4 extends platform services, auth hub production, tracker/nexus deploy, corelib 42/42, and VS Code spec links.

## Cutoff target

- **Version:** v0.4 (`beskid_tracker/data/v0.4/version.json`)
- **End commit:** _(record verify-all landing SHA)_
- **Date:** _(YYYY-MM-DD)_

## Aggregate

| Command | Result |
| --- | --- |
| `cd site/website && bun run verify:trudoc -- --preset ci --strict` | |
| `cd site/website && bun run build` | |
| `cd compiler && just compiler` | |
| `cd compiler && just corelib` | _(42/42 targets)_ |
| `cd compiler && cargo test --workspace` | |
| `cd beskid_tracker && bun run seed:validate` | |
| `cd beskid_vscode && bun run test:all` | |

## Workflow gates (GitHub Actions)

| Workflow | Repo | Expected | Run URL / SHA | Notes |
| --- | --- | --- | --- | --- |
| `beskid-platform` | superrepo | green | | setup-environment, lockfile, dagger smoke |
| `container-images` | superrepo | green | | site, auth, tracker, nexus, pckg matrix |
| `compiler-rust-gate` | superrepo | green | | Dagger `compiler-rust-gate` |
| `corelib-quality` | `compiler/corelib` | green | | 42/42 `just corelib` |
| `beskid_web_common` publish | submodule | green / skip | | `@beskid/ui-react` with `./settings` |
| Open VSX / VS Code | superrepo | green | | extension smoke after v0.4 VS Code tasks |

## corelib-matrix

| Command | Result |
| --- | --- |
| `cd compiler && just corelib` | _(N/42 — record final count)_ |
| `dagger -m beskid_infra/dagger call corelib-gate --source=.` | |

## Service smoke (production)

| Service | URL | Check | Evidence |
| --- | --- | --- | --- |
| auth hub | `https://auth.beskid-lang.org` | OAuth + pairing | |
| tracker | `https://tracker.beskid-lang.org` | Settings sync + webhook | |
| nexus | `https://nexus.beskid-lang.org:8452` | catalog analyze | |
| pckg | `https://pckg.beskid-lang.org:8082` | public catalog + OAuth | |
| site | `https://beskid-lang.org` | platform-spec + book | |

## Prior CI fixes (still valid)

- _(record any carry-over fixes from v0.4 landings that remain green)_

## Coolify

MCP `deploy` or manual redeploy after GitHub Actions green. See [deploy matrix](../../beskid_infra/docs/deploy-matrix.md).

## Sign-off checklist

- [ ] Distribution preflight confirms required secret names are configured, without disclosing values: `DISTRIB_GH_PAT`, `HOMEBREW_TAP_GIT_TOKEN`, and `SNAPCRAFT_STORE_CREDENTIALS`
- [ ] GitHub Packages install proof covers the exact `@beskid/beskid-ui`, `@beskid/ui-react`, and `trudoc` versions used by the release; the associated image workflow URL is recorded
- [ ] Open VSX credential is configured and the extension publication run is green or records an idempotent already-published outcome
- [ ] Coolify production evidence records immutable image digests and deployment URLs; Auth Hub OAuth pairing succeeds for every consumer
- [ ] Tracker webhook delivery and Nexus catalog analyze smoke both have timestamped production evidence
- [ ] Distribution run records a completed marker only after every platform publication is green; a failed fan-out has no marker and is rerun after remediation
- [ ] All six v0.4 deliverables closed in seed catalog
- [ ] `version.json` status → `Released`
- [ ] Seed imported into tracker SQLite on production
- [ ] `bun run seed:validate` green on landing commit

## Related docs

- [Deploy matrix](../../beskid_infra/docs/deploy-matrix.md)
- [OpenBao layout](../../beskid_infra/docs/openbao-layout.md)
- [v0.4 article](../../beskid_tracker/data/v0.4/article.md)
