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

## CI and publication gates

| Lane | Authority | Expected | Run URL / SHA | Notes |
| --- | --- | --- | --- | --- |
| `linux-platform` | AppVeyor | green | | OpenSpec, platform, Corelib, web, image build and registry publication |
| `linux-compiler` | AppVeyor | green | | Compiler and Linux ABI-v5 runtime-kit |
| `macos-compiler` | AppVeyor | green | | macOS arm64 ABI-v5 runtime-kit |
| `windows-compiler` | AppVeyor | green | | Windows x86-64 ABI-v5 runtime-kit |
| Compiler release / Distribution | GitHub-native workflows | green or not requested | | Explicit publication after recording AppVeyor source/build evidence |
| Open VSX / VS Code | GitHub-native workflows | green or skip | | Editor-marketplace publication only |

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
| nexus | `https://nexus.beskid-lang.org` | catalog analyze | |
| pckg | `https://pckg.beskid-lang.org` | public catalog + package readback | |
| site | `https://beskid-lang.org` | platform-spec + book | |

## Prior CI fixes (still valid)

- CYB-130 (2026-07-21): web_common lockfile pin, pckg/tracker Docker `file:` parity, tracker-delivery submodule+Bun cache, Coolify `service_uuid` fallback — see `docs/superpowers/reports/2026-07-21-cyb-130-cicd-release-gate-parity.md`. Staging Coolify service UUID still missing.

## Watchtower

AppVeyor publishes controlled `production` tags to `cr.beskid-lang.org` after
the platform lane succeeds. Watchtower alone reconciles those tags into
production. Record immutable `sha-*` image identity, Watchtower status, and
public service health; do not invoke a GitHub or AppVeyor deployment job.

## Sign-off checklist

- [ ] Distribution preflight confirms required secret names are configured, without disclosing values: `DISTRIB_GH_PAT` and `HOMEBREW_TAP_GIT_TOKEN`
- [ ] Package install proof covers the exact `@beskid/beskid-ui`, `@beskid/ui-react`, and `trudoc` versions used by the release; the associated AppVeyor build URL is recorded
- [ ] Open VSX credential is configured and the extension publication run is green or records an idempotent already-published outcome
- [ ] Watchtower production evidence records immutable `cr.beskid-lang.org` image identities and public health URLs; Auth Hub OAuth pairing succeeds for every consumer
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
