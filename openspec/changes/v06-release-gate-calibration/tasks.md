## 1. Specification

- [x] 1.1 Write the proposal, the gate inventory in `design.md` and the release-policy spec delta.
- [x] 1.2 Edit the requirement "Installed beginner workflow acceptance" and scenario `CLI06-06-OBS` in `openspec/changes/v06-cli-dependencies/specs/tooling--cli--command-surface/spec.md`: the observation is a published, non-blocking quality target; an invalid or forged record fails closed; the owner waiver is removed.
- [x] 1.3 Validate with `openspec validate v06-release-gate-calibration --strict` and `openspec validate --all --strict --no-interactive`.

## 2. Candidate rule (0.6.0)

- [x] 2.1 `scripts/ci/release-user-observation.mjs`: resolve candidate C from the committed record, the gate input or HEAD; require C to be HEAD or an ancestor of HEAD with equal `compiler` and `beskid_distrib` gitlinks and an equal release-case manifest digest. Remove the "exactly one changed file" rule.
- [x] 2.2 `scripts/ci/woodpecker-release.sh` and `.woodpecker/release.yml`: pass `BESKID_RELEASE_CANDIDATE` to `--source` and `--release`.
- [x] 2.3 Tests in `scripts/ci/test/release-user-observation.test.mjs` and `scripts/ci/test/woodpecker-release.test.sh`: root-only commits after C are accepted; changed compiler, distribution or manifest identity, a non-ancestor and a record/input conflict are refused.

- [x] 2.4 Per-platform sources: `--platform-sources` resolves the build identity (`compiler`, `beskid_bsol`, `beskid_distrib`, manifest digest) and each platform's source (default C) against `NON_BUILD_PATHS`; `woodpecker-fetch-handoffs.sh`, `woodpecker-aggregate-release.mjs`, `build-release-state.sh`, `woodpecker-release.sh` and `.woodpecker/release.yml` consume them; the release state records `platform_sources` and `build_identity`.
- [x] 2.5 Tests: C/C/D with an allowlisted diff is accepted, a build-script diff and a different compiler pointer are refused (`release-user-observation.test.mjs`, `woodpecker-release.test.sh`, `woodpecker-release-evidence.test.mjs`).

## 3. CLI06-06 as a published, non-blocking target (0.6.0)

- [x] 3.1 `--release` reports `pass`, `below-threshold` or `not-performed` and exits 0; an invalid or forged record exits 1. Remove the owner waiver.
- [x] 3.2 Store the report as `user_observation` in `release-state.json` for every release and print its summary in the release notes (`scripts/ci/render-compiler-release-notes.sh`).
- [x] 3.3 Update `docs/release/cli06-06-usability-check/README.md`. The kit stays.

## 4. Compiler gate (0.6.0)

- [x] 4.1 Remove the `legacy_patterns` loop from `run_lint_phase` in `scripts/ci/compiler-rust-gate.sh`; keep clippy.
- [x] 4.2 Extend `scripts/ci/test/compiler-rust-gate-timeout.test.sh`: the lint phase passes on sources with retired names, runs clippy, and the script has no `legacy_patterns`.
- [x] 4.3 Run clippy report-only in the release gate (findings logged with a count; never fails); test it in `compiler-rust-gate-timeout.test.sh`.

## 5. Corelib publisher (0.6.0)

- [x] 5.1 Derive the publish set from `CoreLib.bws` members minus the commented `EXCLUDED_CORELIB_MEMBERS` (`corelib_tests`, `corelib_pest_gen`, `pest_gen_schema`); publish `serialization_mod` as the dependency of `corelib_serialization`.
- [x] 5.2 Make `BESKID_PCKG_VERSION_BUMP` (`patch`, `minor`, `major` or an exact version; default `patch`) the pipeline input in `.woodpecker/pckg.yml`, `scripts/ci/corelib-publish.sh` and the runner.
- [x] 5.3 Add `scripts/ci/test/corelib-publish-runner.test.mjs`: derivation, exclusion, an unlisted new member, a stale exclusion and the bump input.
- [ ] 5.4 Add readmes to `corelib_bsol`, `corelib_serialization` and `serialization_mod` in the compiler repository (quality only; a readme is optional for the packer). Run `corelib-publish.sh --dry-run` on the 0.6 bundle to confirm that `beskid pckg pack` packs the Mod `serialization_mod`.

## 6. Deferred to 0.6.1

- [x] 6.0 Reorder `.woodpecker/linux.yml`: build, release gates with the status captured, packaging, upload, then exit with the gate status (design D5). A failed gate still blocks publication through the aggregate. (0.6.6: `linux.yml` captures `gate_status`, packages and uploads, then exits with it; `woodpecker-workflow-contract.test.sh` asserts the order.)
- [ ] 6.4 `verify-linux-package-derivative.mjs` validates the qualified evidence as one source; make it validate per platform like the aggregate before a release with mixed platform sources publishes a Linux package derivative.

- [ ] 6.1 Remove the duplicate `V06_CASE_MANIFEST_SHA256` pin in `scripts/ci/woodpecker-release-evidence.mjs`; CI recomputes the digest of the committed `scripts/ci/release-cases-v06.json` and compares it with the manifest that the evidence names.
- [ ] 6.2 Change the CLI surface gate (`scripts/ci/woodpecker-cli-surface-evidence.mjs`) to check exit codes, JSON documents and command presence instead of exact help prose.
- [ ] 6.3 Require the Windows installer owner waiver only when the installer is unsigned or the release declares a known gap.
- [x] 6.5 Stop putting build caches in the release bundle at assembly. `build-release-artifact.sh` prebuilds each Corelib Mod with `beskid dev mod rebuild` inside the bundle and ships the Mod's `obj/beskid/` (dependency materialization, Salsa cache, `.materialize-lock`) and `.beskid/obj/mods/<pkg>/.cache-lock` beside the sealed Mod entry (Linux #334: 2058 of 3447 files). 0.6.0 removes them only in the installer packaging step (`scripts/ci/lib/bundle-caches.mjs`); the release tarball, and the Homebrew formula that installs it, still carry them. Prune at assembly and add the `BundleCacheViolations` check to the `bundle-contents` verification in `woodpecker-build-platform.sh`. (0.6.6: `build-release-artifact.sh` runs `lib/bundle-caches.mjs prune` before archiving, `woodpecker-build-platform.sh` checks the archive listing, and native packaging refuses a bundle with caches instead of pruning it.)
- [x] 6.6 Shorten the sealed Corelib Mod layout `<mod>/.beskid/obj/mods/<pkg>/<64-hex key>/<target>/sdk/...` in the compiler. Its deepest file is 223 characters below the bundle root, 12 characters inside MAX_PATH below `C:\Program Files\Beskid\`; the MSI harvest uses verbatim source paths and rejects an installed path past MAX_PATH, but a longer install directory chosen in the installer UI can still exceed it. (0.6.6: the cache key is the first 32 hex digits of the descriptor identity SHA-256, compiler ccac84c8; the deepest file moves from 12 to 44 characters inside MAX_PATH. Requirement "Native Mod cache key length" in this change.)
