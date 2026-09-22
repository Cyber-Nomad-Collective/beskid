# NixOS remote Rust-build research

Date: 2026-09-20

Scope: read-only investigation of the checked-out beskid delivery configuration,
the reachable NixOS worker, and primary Cargo, Nix, and sccache documentation.
This is a design recommendation, not a host or repository configuration change.

## Decision

Use the NixOS machine as a **separate, unprivileged developer build executor**,
not as another Woodpecker job and not as a shared Docker-socket service. Run the
same pinned Linux Rust container family that Woodpecker uses, with a private
remote checkout, persistent Cargo/sccache caches, and an explicit CPU/memory
budget. Invoke it from the Mac through a small SSH wrapper after it is reviewed
and provisioned.

This is the convention-fit choice because it preserves the existing division of
responsibility: Woodpecker validates trusted source and emits release evidence;
the developer executor accelerates disposable `check`, targeted `test`, and
`clippy` work. A Linux result is useful compiler evidence but cannot replace the
native macOS release-build lane.

## Codebase and host facts

| Fact | Evidence | Consequence |
| --- | --- | --- |
| The checked-in Linux CI job selects `role=beskid-linux`, runs a pinned `rust:1.98.1-bookworm` image, installs the linker/tooling set, initializes `beskid_distrib`, then runs the repository CI scripts. | [.woodpecker/linux.yml](../../.woodpecker/linux.yml#L1-L45) | A remote developer runner should use this Linux toolchain contract, rather than silently use an arbitrary host Rust version. |
| The documented Woodpecker Linux worker is a Docker workflow with one slot, a 3 GiB limit, two CPU cores, and mounts for durable release output, SFTP handoff keys, and a read-only handoff tree. | [deploy/woodpecker/compose.yml](../../deploy/woodpecker/compose.yml#L45-L71) | Do not route developer builds through the agent or mount its socket, output, handoff, or credential paths. Those are release-bound trust surfaces. |
| Woodpecker is documented as the build runner; Linux performs validation, while Linux/macOS/Windows perform native release packaging. | [Woodpecker operations guide](../operations/woodpecker.md#L1-L6) | Remote Linux development builds supplement rather than replace CI and cannot validate a Darwin artifact. |
| The compiler workspace has a sibling `../beskid_bsol` path dependency. | [compiler workspace manifest](../../compiler/Cargo.toml#L55-L58) | The remote source layout must stage the superproject with both `compiler/` and `beskid_bsol/`, not copy the compiler directory alone. |
| The compiler currently enables incremental development builds and documents an optional shared target directory; its checked-in Cargo config deliberately keeps sccache opt-in. | [compiler/Cargo.toml](../../compiler/Cargo.toml#L91-L95), [compiler/.cargo/config.toml](../../compiler/.cargo/config.toml#L1-L8), [compiler/justfile](../../compiler/justfile#L74-L77) | Preserve incremental compilation for one stable remote checkout; enable sccache explicitly only on an executor where it is installed. Do not claim it is already wired in the project. |
| `compiler-rust-gate.sh` sets `RUST_MIN_STACK`, stages an ABI-v5 runtime kit below the target directory, and serializes workspace tests. | [compiler Rust gate](../../scripts/ci/compiler-rust-gate.sh#L12-L18), [runtime phase](../../scripts/ci/compiler-rust-gate.sh#L61-L89) | The remote runner must carry the target directory through `CARGO_TARGET_DIR` and should use the existing gate for CI-equivalent Linux verification. |
| The live `root@10.66.0.2` host reached through `root@bdziam.dev` identifies as NixOS 24.11, with 16 CPUs, 61 GiB RAM (34 GiB available at observation), 1.6 TiB root-filesystem free space, and active `woodpecker-local-{linux,linux-2,linux-3,platform,release}` services. No host `cargo`, `rustc`, `rustup`, or `sccache` executable is presently installed; Docker and Podman are available. | Read-only SSH observation, 2026-09-20 (commands deliberately omitted service environment and unit command lines). | NixOS itself is not a ready Rust executor. The existing worker must be treated as a contended, production-adjacent host; provide the toolchain in an isolated image or explicitly pinned Nix shell. |
| The observed Woodpecker systemd units have no unit-level CPU or memory ceiling. This does not prove their child container limits or current utilisation. | Read-only `systemctl show` observation, 2026-09-20. | A developer executor needs its own resource guard and must not rely on inferred spare capacity. |

## Recommended architecture

```text
Mac editor / terminal
  │  authenticated SSH; source allowlist or exact Git revision
  ▼
private remote checkout (stable absolute path; compiler + beskid_bsol)
  │
  ├── persistent target/           one executor checkout, lock-protected
  ├── persistent Cargo registry/   private to developer executor
  └── persistent sccache/          bounded, toolchain-keyed
  │
  ▼
rootless Podman container, pinned to the Woodpecker Rust image family
  │  constrained CPU/memory scope; no Docker socket; no CI mounts/secrets
  ▼
cargo check / targeted cargo test / clippy  ──► streamed exit status and logs to Mac
```

### Source and artifact boundary

1. The normal input is an exact pushed superproject revision plus its pinned
   submodules. The wrapper verifies the revision before execution. This makes a
   result attributable and avoids synchronising unknown local files.
2. Supporting unsaved Mac work is a separate, explicit mode. It should transfer
   an allowlisted tracked diff or a narrowly defined source snapshot; it must
   exclude `.beskid`, target directories, host configuration, credentials, and
   release-output directories. Do not make broad `rsync --delete` of a home or
   project root the default.
3. Keep final Linux artifacts on the remote executor only long enough to read
   the requested logs/results. Return a Mac-consumable report, not Linux
   binaries as replacements for locally installed Darwin CLI/LSP binaries.

### Execution boundary

Provision one non-login service identity such as `beskid-dev-build` with a
private working root and rootless Podman access. Start each build in a dedicated
systemd scope or equivalent resource envelope; begin conservatively (for
example, six CPU cores and 16 GiB) and benchmark under real CI/model load before
raising it. Set Cargo's job count to the same budget. Cargo defaults its job
count to logical CPUs and accepts `CARGO_BUILD_JOBS`/`--jobs`, so leaving it at
the host default would allow one developer build to consume all 16 CPUs
([Cargo configuration reference](https://doc.rust-lang.org/cargo/reference/config.html#buildjobs)).

The container should be an explicitly reviewed digest built from the same
`rust:1.98.1-bookworm` family as `.woodpecker/linux.yml`, with the CI package
prerequisites. It must not inherit the Woodpecker agent secret, Docker socket,
handoff keys, output binds, or protected pipeline variables. This retains a
single Linux build-toolchain shape without treating CI infrastructure as a
general-purpose SSH build farm.

Nix is appropriate for provisioning the service identity, Podman policy, and
possibly a reproducible dev shell. It is not itself the acceleration mechanism.
The repository has no tracked `flake.nix` or `shell.nix`, and the host has no
Rust toolchain. Invoking an unpinned `nix shell nixpkgs#rustc` would therefore
drift from the pinned CI toolchain. If a Nix-native runner is later preferred,
first add a reviewed, locked flake that selects the same Rust version and native
libraries. `nix develop` is designed to provide the build environment of a
derivation and can run a command non-interactively
([Nix manual](https://releases.nixos.org/nix/nix-2.24.1/manual/command-ref/new-cli/nix3-develop.html)).

### Caching policy

Cargo stores final output and internal intermediates beneath its target/build
directories; `CARGO_TARGET_DIR`, `build.target-dir`, or `--target-dir` change
that location ([Cargo build-cache reference](https://doc.rust-lang.org/cargo/reference/build-cache.html)).
Use a stable path for the one remote checkout and protect it with a per-checkout
lock. Do not share one mutable target directory between concurrent remote
worktrees: this repository already has runtime-kit output beneath the target
tree, and Cargo build artifacts carry workspace-path state.

Install sccache in the remote image and opt in per invocation with
`RUSTC_WRAPPER=sccache`; Cargo documents that integration as the way to share
built dependencies across workspaces
([Cargo build-cache reference](https://doc.rust-lang.org/cargo/reference/build-cache.html#shared-cache)).
Give its cache a bounded, service-owned directory and publish `sccache --show-stats`
in the wrapper report. sccache's own Rust caveats matter here: compiler-invoking
binary/proc-macro crates are not cacheable, and incrementally compiled crates
are not cacheable ([sccache README](https://github.com/mozilla/sccache#rust)).
Thus:

- Keep Cargo incremental compilation for repeated edits in one checkout; the
  persistent target tree is the main win.
- Use sccache primarily for dependencies and clean/release-like rebuilds. For a
  clean benchmark lane, disable incremental compilation deliberately and compare
  cold/warm runs; do not disable it for interactive development by default.
- Do not introduce sccache distributed compilation initially. Its macOS client
  path requires explicit toolchain-archive work and the same Rust compiler
  version on the client/server ([sccache distributed quickstart](https://github.com/mozilla/sccache/blob/main/docs/DistributedQuickstart.md#considerations-when-distributing-from-macos)).
  A remote-execution wrapper avoids that cross-platform toolchain problem.

## Implementation plan (requires a separate approved change)

| Step | Owner/scope | Acceptance evidence |
| --- | --- | --- |
| 1. Capacity and isolation audit | NixOS operator | Confirm rootless Podman works for the dedicated identity; enumerate current CI/model capacity without exposing secrets; choose CPU/memory/disk quotas and scheduling policy. |
| 2. Provision executor | NixOS configuration owner | Dedicated identity, private paths, bounded cache size/retention, transient/service resource envelope, and no access to Woodpecker credential/output mounts. No `nixos-rebuild` until this configuration is reviewed. |
| 3. Define reproducible toolchain | Repository + operator | Pinned container digest (or locked Nix flake) with Rust 1.98.1 and the same required Linux packages as the CI lane; print `rustc -vV`, Cargo, linker, and sccache versions in every report. |
| 4. Add a local wrapper | Repository | `check`, targeted test, and lint invocation from macOS; exact-revision mode; opt-in dirty-source mode with an explicit allowlist; cancellation; streamed logs; no Linux artifact installation. |
| 5. Cache and contention validation | Repository + operator | Cold versus warm timings for representative `cargo check`, the focused compiler test suite, and `compiler-rust-gate.sh`; sccache statistics; concurrent CI/developer test proving quotas prevent starvation. |
| 6. Document operational boundary | Repository operations docs | Developer executor is explicitly non-release; Woodpecker remains the only release/validation service; cache cleanup is bounded and recoverable. |

## Rejected alternatives

| Alternative | Why it is not appropriate now |
| --- | --- |
| Submit ordinary local builds as Woodpecker pipelines | It consumes the protected CI scheduler, may require a pushed branch, and has intentional 2-core/3-GiB job limits plus release-adjacent mounts. |
| Run Cargo directly as root on the NixOS host | The host lacks Rust today; it leaves an unmanaged mutable toolchain/cache on a shared machine and bypasses the existing CI toolchain contract. |
| Reuse a single target directory across arbitrary remote worktrees | It risks concurrent mutation and makes runtime-kit/intermediate ownership ambiguous. |
| Install sccache only on the Mac and use its distributed mode immediately | The official distributed setup has extra macOS toolchain-archive/version constraints; remote execution with a persistent Linux cache is smaller, reproducible, and lower-risk. |

## Open decisions

1. Which NixOS configuration repository owns the dedicated developer executor?
2. Which account should be allowed to submit source snapshots, and should dirty
   source support start disabled?
3. What resource budget remains safe while the three active Linux agents and
   local model workloads are busy?
4. Should the container image be assembled in the repository delivery pipeline
   or maintained as a host-local Nix derivation with an immutable digest?

Until these are answered, the safe action is read-only capacity inspection and
normal local/CI builds; do not repurpose Woodpecker services or production
paths for ad-hoc compilation.
