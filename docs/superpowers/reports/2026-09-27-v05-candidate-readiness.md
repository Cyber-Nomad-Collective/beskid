# v0.5 candidate readiness, 2026-09-27

This is local candidate evidence, not an authorization to publish. No branch has
been pushed or merged to `main`, and no v0.5 release asset has been published.

## Source identity

- Superrepo integration branch `codex/windows-prereqs-task4-root` now also contains
  the v0.5 networking/HTTP spec integration (`53e8ef36`) and the regenerated
  catalog for this checkout (`5f9603e5`). This report is on the same branch.
- Compiler branch `codex/v05-release-integration-2`: `b887e58f`.
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
   The cleanup diagnostic has a specific cause: `Invoke-DownloadCancellation`
   throws its original monitor error in `try`, then calls
   `Stop-InstallerProcessTree` from `finally`; if cleanup also throws,
   PowerShell reports only the cleanup exception. A minimal PowerShell
   reproduction confirmed that `finally` replaces the primary exception.
   The Windows helper source on the disposable VM hashes identically to the
   checked-out helper (`8c86811a...`), so this is not a stale-source mismatch.
2. Twelve branded installer screenshots (welcome, options, progress, success,
   failure, and MSI directory at 100% and 150% scaling) need capture and human
   inspection. None has been claimed as verified.
3. The release script intentionally refuses publication even if structural
   Windows evidence is complete: no trusted disposable-VM provenance and
   transfer path is integrated with Woodpecker. Do not bypass that fail-closed
   check or give Woodpecker publication credentials. The Windows build pipeline
   runs on the ordinary Windows agent (`.woodpecker/windows.yml`), whereas the
   Linux release agent runs on the builder (`.woodpecker/release.yml`). The
   builder currently has the approved disposable clone as an active VM service,
   but `windows-installer-smoke-gate.mjs` only checks self-reported VM identity
   and artifact hashes; it cannot authenticate the VM or evidence transport.
   A host-attested disposable-VM execution and transfer design is therefore
   still required before the hard stop in `woodpecker-release.sh` can be
   replaced. Do not treat the nine existing scenario records as trusted CI
   evidence merely because they pass structural validation.
4. Final committed-source CI artifacts, qualified release-state evidence, and
   approved main-branch merges/pushes are not yet available.
5. The HTTP implementation accepts HTAB and obs-text field values while the
   integrated v0.5 requirement says ASCII values without control bytes. The
   exact policy is awaiting confirmation before code and tests change.
6. The deterministic Linux DNS deadline shim is not yet evidenced. A focused
   rerun confirmed `BESKID_DNS_DEADLINE_SHIM=1` in the CLI process environment,
   but the test still compiled/executed its ordinary-resolution branch. The
   diagnostic script now filters to the DNS-deadline test and fails closed
   unless the blocked-resolver branch appears in the JIT trace. The builder
   run in `v05-integration-2-dns-shim-assert.log` reported 1/1 test passed but
   exited 1 with `DNS deadline shim scenario was not compiled`; this is an
   unresolved release gate, not a passing deadline test. A separate probe set
   `BESKID_DEFINITELY_NOT_SET_XYZ=1` and ran `SystemEnvironmentTests`: the
   existing `env_get_missing_var_returns_not_found` assertion trapped as
   expected (`v05-integration-2-positive-env-probe.log`, exit 101). Thus a
   present environment value reaches the JIT's `Environment.Get` path; the
   remaining fault is narrower than general process-environment propagation.
   A second focused shim run (`v05-integration-2-dns-shim-assert-r2.log`)
   reproduced the same exit-1/no-shim-branch result in 44 seconds.
   Source inspection narrows the next diagnostic: the runtime test gates the
   shim on `Environment.Has`, whose only implementation calls
   `Option.HasValue(TryGet(name))` with an inferred type argument. The existing
   environment tests check only absent/empty values, and the only tested
   `Option.HasValue<string>` call is also for `None`. A positive-value test
   should distinguish `TryGet` returning `None`, generic `HasValue<string>`
   mishandling `Some`, and the inferred call in `Has`; no one of these is yet
   established as the root cause.
7. The contract-system change still requires `This` substitution through a
   generic bound at its monomorphized use site. Bound admission exists, but
   the corresponding end-to-end scenario and task 3.6 remain open. Generic
   receiver field-chain and impl-owner cases lack focused coverage. In the
   current compiler source, `contract_member_receiver` explicitly returns
   `None` when a parameter annotation names an enclosing generic parameter;
   `method_declaration_for_member_receiver` then only seeks a concrete
   nominal declaration. The existing specialization test proves that a
   non-conforming argument is rejected at a `where` bound, while another test
   proves that an *unconstrained* generic does not acquire contract members.
   Neither proves the specified `where T: C` member call resolves and
   monomorphizes. This is a missing behavior/evidence seam, not a workspace
   build failure.

The automatic release watcher is paused. The original Windows VM disk is
untouched; disposable overlays are retained and have not been deleted.

## Update, 2026-09-28

The user completed an interactive install on disposable VM 08. The bundle log
reports that the VS Build Tools package ran, the MSI completed successfully,
and Burn finished with result `0x0`. In a fresh SSH session without `BESKID_*`
overrides, the installed `C:\Program Files\Beskid\bin\beskid.exe` reported
version 0.5.0 and successfully ran the `test`, `build`, and `run` smoke inputs;
the resolved Corelib paths pointed under `C:\Program Files\Beskid`. This is
additional local installation evidence, not a release-pipeline scenario record
or proof of the clean prerequisite-download path: VC++ and LLVM were already
present. A pending-file-rename registry entry from VS setup remains, although
Burn reported `restart: None` and the smoke commands worked without a reboot.

The bundle Options page has a disconnected install-location field. Its theme
declares an `InstallFolder` edit box, but the bundle declares no matching
default variable and passes no `INSTALLDIR` property to the MSI. The Burn log
records an empty `InstallFolder`; the MSI installed to its own default path.
The default install passing does not validate a user-selected path. This is a
new installer release blocker requiring a test-first WiX correction and an
interactive default/custom-path check on disposable overlays.

Disposable VM 09 was created from the offline VM 07 backing image and booted
without touching installed VM 08. Its pre-install snapshot already contains
MSVC Build Tools, the Windows SDK, and LLVM, so it does not provide a real
vendor-download cancellation window. VM 09 was then shut down cleanly; its
overlay is retained. Removing developer components from VM 09 for this test
awaits user approval. The cancel scenario remains unproven.

The HTTP policy is no longer an open interpretation question: the integrated
v0.5 requirement says `ASCII header values without control bytes`. The current
codec and `HttpValidationTests` accept HTAB and obs-text, contradicting that
requirement. The code/test correction awaits approval of the bounded design.

Local rechecks of `windows-installer-smoke.test.mjs` passed 5/5 and
`woodpecker-release.test.sh` passed. Those prove the structural/negative
checks, not the missing real cancellation evidence or release provenance.
`woodpecker-release.sh` still has an unconditional publication stop after
checking for the smoke directory; it deliberately does not authenticate or
consume self-reported VM evidence. The trusted disposable-VM execution and
transfer design remains an architectural release gate.

## Update, 2026-09-28: corrected bundle on disposable VM 09

The corrected WiX v4 bundle was built on Windows and copied to disposable VM
09. Its SHA-256 is `19779b271c7602e9ae1505e2631dd88d767ffca93382cad7b1f572d92398a748`.
The user installed it interactively with `InstallDeveloperTools=1`. The Burn
log at `C:\Users\Administrator\AppData\Local\Temp\Beskid_20260928125144.log`
records a real `VsBuildTools2022` download from the locked Microsoft URL,
payload verification, VS installation exit `0x0`, MSI installation exit
`0x0`, and overall apply result `0x0` with no requested restart. VC++ x64
14.44 and LLVM 22.1.8 were already installed, so this run does not prove
their download paths. Build Tools 17.14.41 appeared after installation;
the Windows SDK library version is 10.0.26100.0. The MSI received
`INSTALLDIR="C:\Program Files\\Beskid"`, and the installed files reside in
`C:\Program Files\Beskid`.

In a fresh key-only SSH PowerShell process with `BESKID_*`, `INCLUDE`, `LIB`,
`LIBPATH`, VS and SDK environment overrides removed, and `PATH` reconstructed
from machine and user values, the installed `beskid.exe` reported 0.5.0.
Its real test-harness fixture passed 3 tests and skipped 1 (`TEST_EXIT=0`);
the smoke-project fixture built an executable (`BUILD_EXIT=0`) and ran it
(`RUN_EXIT=0`). The installed `lld-link.exe --version` also executed.

This is a successful local opt-in install and ordinary-shell CLI smoke, but
it is not the clean ten-scenario installer matrix or CI-attested release
evidence. In particular, the blank/custom install-path UI, cancellation
during a vendor download, 100%/150% branded-page screenshots, repair,
upgrade, uninstall, and final committed-source CI are not yet proven by
this run. Do not treat it as publication approval.

## Update, 2026-09-28: Linux DNS deadline evidence

The integrated Linux candidate's uninstrumented CLI passed the full Corelib
matrix (81/81) and runtime matrix (7/7). Both still printed
`release eligible: false` because the source checkout was dirty and not a
committed-source release attestation.

The deterministic DNS deadline test was not taking the ordinary branch as
the earlier report inferred. A resolver interposer showed that the same test
process entered the blocked lookup, observed it, released it, and completed
the late host job. The old diagnostic script checked for a function name in
the JIT progress display, which samples names and omitted the executed
function while displaying an unexecuted one. Compiler commit `831d8475`
now verifies resolver-emitted markers instead. The real Linux check exited
0 with all three markers and 1/1 test passed; a no-marker negative check
exited 1. This closes the DNS deadline evidence gap, not the remaining
generic-contract, exact-source, cross-platform, or publication gates.

The generic-contract gap is broader than item 7 above: the normative
OpenSpec change still has unchecked tasks 2.7 (`GenericBoundNotSatisfied`
diagnostic), 3.6 (bounded receiver method resolution), and 3.7
(`ContractDispatch` to static implementation dispatch). Its task 3.5 also
explicitly defers bound-site `This` and `T::Item` substitution, despite
normative scenarios for both. A release-completion audit must cover these
requirements rather than treating a single resolver edit as sufficient.

## Update, 2026-09-28: HTTP source recheck

Blocker 5 above is stale for the current Corelib candidate. Commits
`49972a2` and `a289712` implement and test strict IPv6 Host separators and
ASCII field values without control bytes. `HttpValidationTests.bd` now
rejects malformed literals such as `[:::::::]`, HTAB in header values, DEL,
and high octets on both parse and serialization paths; `Codec.bd`'s
`FieldValue` admits only SP and visible ASCII. The subsequent full Linux
Corelib matrix passed 81/81, but this remains candidate evidence until a
clean committed-source release run binds the test result to these commits.

## Update, 2026-09-28: scoped installer waiver and template diagnosis

The release owner explicitly waived the remaining Windows installer scenario
tests. The manual publisher now has a separate, fail-closed waiver route: a
decision record must match the final source commit, stable version, and exact
SHA-256 of the checksum-validated Windows setup EXE. It records the narrow
`windows-installer-scenario-tests-only` scope in qualified
`release-state.json`; it does not assert that the scenarios or VM attestation
passed. A missing, stale, broader, or symlinked waiver is rejected before any
GitHub call. The Woodpecker release contract suite passed locally after its
macOS fixture was updated to the current two-profile runtime-kit bundle
layout. This is code/fixture evidence, not a production publication result;
the final source commit and artifact hash are not yet available for a real
waiver record.

An installed macOS CLI 0.4.745 reproduces `beskid new install
beskid.templates.lib` failing with E2001, missing `.beskid/template.json`.
Source tracing shows pack promotes that file to artifact-root `template.json`,
while the template extractor still requires the original authoring path.
`beskid new lib` without `-o` is a separate usage error: the output directory
is required. The pack/extract mismatch remains to be fixed and verified
against a packed template before release.

## Update, 2026-09-28: template fix, macOS matrix, and portable lock design

The previous template blocker is fixed on compiler candidate `bdacf7fb`.
`beskid_template` now maps archive-root `template.json` back to the authoring
`.beskid/template.json` location and rejects parent-path ZIP entries. Both
regression tests failed before the change. The focused crate suite passed 5/5
on Linux and 5/5 on macOS; the candidate macOS CLI rebuild exited 0.

The macOS full Rust workspace run on candidate `8d31d9f6` exited 0 with
2,684 tests passed and none failed. After the template fix was integrated, the
macOS Corelib matrix passed 81/81. Its CLI summary still reported
`release eligible: false`; generated tracked `Project.lock` files record
checkout-specific absolute paths and are rewritten during tests. The macOS
runtime matrix is in progress and has no final result in this update.

Strict validation of the networking change passed, and `bun run
openspec:validate` exited 0 with 218/218 items. HTTP strict validation also
passed. These validate specification structure, not every runtime scenario.

Portable `Project.lock` v2 is now an approved architectural direction and
written design. Root commit `9874c50f` adds
`docs/research/2026-09-28-portable-project-locks.md` and
`docs/superpowers/specs/2026-09-28-portable-project-lock-v2-design.md`.
No compiler behavior change or OpenSpec normative change has been made for v2
yet. The design retains explicit v1 migration, portable Corelib anchoring,
stable logical materialization IDs, registry version/digest pins, and
fail-closed replay checks.

## Update, 2026-09-28: release-gate control-flow audit

The portable-lock implementation plan is recorded in root commit `c73313bf`;
product work awaits the plan review and execution-method choice.

The Woodpecker release state has a source-bound test-evidence gap independent
of the passing local Rust/Corelib runs. `.woodpecker/linux.yml` invokes
`scripts/ci/test/run-woodpecker-tests.sh`, which runs CI migration contract
fixtures, then the native build. It does not invoke the compiler Rust or
Corelib test gates. `woodpecker-aggregate-release.mjs` synthesizes only
`native-build` stage reports and passes the literal `success` gate argument to
`build-release-state.sh`; for stable, that script can set `publishable=true`
from three successful platform builds without a compiler/Corelib matrix
report. This is a qualification bug in the state artifact, even though
`woodpecker-release.sh` currently has a separate publication hard stop.
The local `build-release-state.test.sh` suite exits 0 while its stable-path
fixture explicitly expects `publishable=true` and synthetic
`["compiler-rust-gate", "lsp-command-contract-gate"]` labels from a literal
`success` input with no stage reports. Thus the current contract test codifies
the missing-evidence behavior instead of rejecting it.

The existing `scripts/ci/corelib-gate.sh` is not ready to be wired into the
current candidate unchanged: its required-file list includes
`packages/foundation/src/Core/Syscall/Syscall.bd`, absent from Corelib
`a289712`. The active canonical Corelib quality/target contract must be
reconciled before the gate runs. No release-pipeline code was changed by this
audit, and no fabricated green test report is accepted as qualification.

## Update, 2026-09-28: macOS runtime matrix complete

The macOS arm64 runtime matrix on compiler `bdacf7fb` and Corelib `a289712`
finished with exit 0: 7/7 targets passed, 0 failed. It used the candidate's
verified native runtime kit and checked-out Corelib, with `RUST_MIN_STACK`
set to 67,108,864 bytes and the command throttled through `nice -n 19`.
Available disk space was 30 GiB at completion. The CLI still printed
`release eligible: false`: tracked `Project.lock` files in both compiler and
Corelib were rewritten with checkout-local paths during the run, and an
untracked engine `obj/` directory was generated. These artifacts were not
discarded. This proves the macOS runtime tests passed; it does not establish
a clean, source-bound release gate.

## Update, 2026-09-28: networking deadline coverage audit

The integrated networking task 5.1c remains open despite green Linux and
macOS matrices. Current focused tests cover `Deadline.After` zero, negative,
and overflow cases (`system/TimeTests.bd`), TCP read timeout/reuse, pending
read-timer clear, accept timeout/reuse, UDP receive timeout/reuse, one
close/accept/deadline winner, and the deterministic Linux DNS late-result
case. The runtime's `NetworkNativeTests.bd` has nine named network tests;
the Corelib TCP/UDP/DNS fixtures add the public API cases.

The current named fixtures do not prove TCP write-deadline behavior,
pending-write timer replacement/clear, UDP send timeout with unsent-payload
ownership, or repeated deadline/readiness/close races for each operation and
target. The macOS 7/7 result ran the ordinary DNS path, not the Linux-only
blocked-resolver shim. Task 5.1c and target-conformance task 5.2 should not
be checked from the matrix counts alone; add focused cases and repeat the
race evidence on Linux epoll, macOS kqueue, and Windows IOCP.
