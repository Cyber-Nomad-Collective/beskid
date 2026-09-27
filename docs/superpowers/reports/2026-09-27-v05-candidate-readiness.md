# v0.5 candidate readiness, 2026-09-27

This is local candidate evidence, not an authorization to publish. No branch has
been pushed or merged to `main`, and no v0.5 release asset has been published.

## Source identity

- Superrepo integration branch `codex/windows-prereqs-task4-root` now also contains
  the v0.5 networking/HTTP spec integration (`53e8ef36`) and the regenerated
  catalog for this checkout (`5f9603e5`). This report is on the same branch.
- Compiler branch `codex/v05-release-integration-2`: `bae45419`.
- Corelib branch `codex/v05-corelib-integration-2`: `a4fcb34`.
- Distribution branch `codex/windows-prereqs-task4-docs`: `652f839`.
- The superrepo commit pins the compiler and distribution gitlinks. The compiler
  source tree retains only generated `Project.lock`/`obj` changes outside its
  commit; those files were deliberately excluded.

## Verified platform checks

| Platform | Check | Result |
| --- | --- | --- |
| Linux | `cargo test --locked -j4 --workspace --all-targets --no-fail-fast`, with the checked-out Corelib root | Exit 0, 280 passing test-target summaries |
| macOS arm64 | `cargo test --locked -j2 --workspace --all-targets --no-fail-fast` | Exit 0, 280 passing test-target summaries |
| Windows x64 | Fresh compiler CLI and kit; full engine, Corelib, and runtime matrices on one candidate snapshot | Build/kit exit 0; engine 80 tests across 22 binaries, Corelib 81/81, runtime 7/7, all exit 0 |
| Linux | Installed v0.5 bundle, no source-tree Corelib/runtime overrides: `--version`, `test`, `build`, `run` | Passed |
| macOS arm64 | Installed v0.5 bundle and mounted DMG: `--version`, `test`, `build`, `run`, DMG verification | Passed |
| Windows x64 | Real WiX v4 setup/MSI on approved disposable VM clones | 9 of 10 required scenario records passed |

The first Linux full-workspace run failed because the test invocation pointed
`BESKID_CORELIB_ROOT` at a nonexistent directory. The corrected rerun passed.
Do not treat that earlier environment error as a compiler regression.

The integrated OpenSpec networking and HTTP changes pass strict validation.
The regenerated catalog passes `validate-standard`,
`validate-book-traceability`, and `validate-layouts` in this checkout; the full
strict OpenSpec validation passes 218/218 items. These checks validate
specification structure, not the remaining behavioral scenarios.

The Windows rerun logs were copied before VM shutdown to
`/private/tmp/beskid-v05-windows-r3.YYs4CE/`. The engine log SHA-256 is
`3fe009e548d0200bd74c6b31082c672c7ee0ef21daf80f3d48b9ffbc1e40bf6a`;
the Corelib and runtime matrix logs hash to
`b537b0260bf856b12565e3cc4d8c7fcd8640e87810b9a2297d53dbee35b5bd86`
and `e9d43f2e2fa4a33aae80474584788ed9514f31a5f7972ab1eff5c24688fdf063`.
The CLI prints `release eligible: false` for both passing matrices because
this disposable source snapshot has no `.git` metadata for the required
root/compiler/Corelib revision attestation. This is test evidence, not a
substitute for a clean committed-source CI run.

## Local artifact probes

These artifacts were built from source snapshots before the above commits and
are *probes*, not final publishable outputs. A release pipeline must rebuild
them from committed source and bind all evidence to those exact hashes.

| Artifact | SHA-256 |
| --- | --- |
| Linux x86_64 direct-install bundle | `89ca12a1f126769b9c1b42d26c7afd23cb84174df2f8f26ba51ff0517f71c1c4` |
| macOS arm64 direct-install bundle | `3b361606d4e14ebabf9cb9c6930d96a20a66be28e07f38bbe4f6da5e69fd6108` |
| macOS arm64 DMG | `49fa2be9f3e4560baa433c819cf48ef5e1f16e40e648834302c8c1549e52fe42` |
| Windows x64 MSI | `7c966da91f189908ef77be919c866cd25d149d884f915487ade96bb67055378f` |
| Windows x64 setup EXE | `3dbc073947474ddf46ddc0510fe2d484e5fbd1f0c3270a8a66198ed3a1204d4c` |

The Windows scenarios `runtime`, `developer`, `community`, `preexisting`,
`offline`, `hash-failure`, `repair-deselect`, `upgrade` (from the published
v0.4.746 binary), and `uninstall` passed on disposable VM overlays. A separate
partial-Build-Tools case also passed. Flattening those nine case records and
running `windows-installer-smoke-gate.mjs` reaches only `missing scenario:
cancel`; no earlier report was rejected. Evidence is retained locally under
`/private/tmp/beskid-v05-windows-evidence-probe/`.

## Release blockers

1. `cancel` requires a real interactive Burn window during vendor download.
   SSH runs in Windows session 0, where even a Notepad window has a zero main
   window handle. The headless attempt did not establish cancellation evidence;
   its cleanup helper also obscured the original error. No installer process
   remained after that attempt. The tested VM was gracefully shut down and a
   consistent disposable child clone (`disposable-08.qcow2`) is now booted for
   an interactive run; no password is handled by the agent.
2. Twelve branded installer screenshots (welcome, options, progress, success,
   failure, and MSI directory at 100% and 150% scaling) need capture and human
   inspection. None has been claimed as verified.
3. The release script intentionally refuses publication even if structural
   Windows evidence is complete: no trusted disposable-VM provenance and
   transfer path is integrated with Woodpecker. Do not bypass that fail-closed
   check or give Woodpecker publication credentials.
4. Final committed-source CI artifacts, qualified release-state evidence, and
   approved main-branch merges/pushes are not yet available.
5. The HTTP implementation accepts HTAB and obs-text field values while the
   integrated v0.5 requirement says ASCII values without control bytes. The
   exact policy is awaiting confirmation before code and tests change.
6. The deterministic Linux DNS deadline shim is not yet evidenced. A focused
   rerun confirmed `BESKID_DNS_DEADLINE_SHIM=1` in the CLI process environment,
   but the test still compiled/executed its ordinary-resolution branch. A
   passing `NetworkNativeTests` target therefore does not prove the blocked
   resolver's late-result accounting.
7. The contract-system change still requires `This` substitution through a
   generic bound at its monomorphized use site. Bound admission exists, but
   the corresponding end-to-end scenario and task 3.6 remain open. Generic
   receiver field-chain and impl-owner cases lack focused coverage.

The automatic release watcher is paused. The original Windows VM disk is
untouched; disposable overlays are retained and have not been deleted.
