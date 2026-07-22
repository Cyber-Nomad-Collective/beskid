# Beskid superrepo — common tasks.
#
#   just setup     Interactive checkout setup (site wizard)
#   just deps      Check toolchain from repo-deps.json
#   just test-corelib-spine  Slow corelib spine tests with live progress

set shell := ["bash", "-euo", "pipefail", "-c"]

root := justfile_directory()

default:
    @just --list

# Interactive repo setup (submodules, toolchain, site/auth env, pnpm install).
setup:
    "{{root}}/site/setup-wizard.sh"

deps-check:
    "{{root}}/scripts/install-deps.sh" --check --group beskid

deps-install:
    "{{root}}/scripts/install-deps.sh" --install --group beskid

# Prepare Learn deps, or spin up the interactive Learn service locally.
learn-deps:
    cd "{{root}}/site/learn" && pnpm install

learn:
    cd "{{root}}/site/learn" && pnpm run dev --host 0.0.0.0 --port 4173

# Run learn with compiler-backed check endpoint.
learn-runtime-kit:
    cd "{{root}}/compiler" && BESKID_RUNTIME_PREFIX="{{root}}/compiler/target/native-runtime-kit" BESKID_RUNTIME_KIT_PROFILE=debug BESKID_CLI_BIN="{{root}}/compiler/target/release/beskid" ./scripts/stage-native-runtime-kit.sh

learn-server:
    cd "{{root}}/site/learn" && BESKID_RUNTIME_PREFIX="{{root}}/compiler/target/native-runtime-kit" BESKID_RUNTIME_KIT_PROFILE=debug BESKID_BINARY="{{root}}/compiler/target/release/beskid" pnpm run start

# Corelib spine matrix gate (semantic gate, single Salsa session). Use smoke locally:
#   BESKID_CORELIB_SPINE_SMOKE=1 just test-corelib-spine
test-corelib-spine:
    cd "{{root}}/compiler" && cargo test -p beskid_tests corelib_tests_front_end_typechecks_matrix -- --nocapture --test-threads=1

# Run the host-callable CI gates locally (fast tier, seconds). Catches lockfile
# drift, frozen-check failures, and normative-spec validation errors before push.
gate args='':
    "{{root}}/scripts/local-preflight.sh" {{args}}

# Full-fidelity run: host tier first (fail-fast), then act+podman for YAML and
# container gates. Compiler gate is SKIPped (Blacksmith Testbox only).
gate-full:
    "{{root}}/scripts/local-preflight.sh" --full

# Build release beskid_cli + beskid_lsp and replace installed toolchain binaries.
replace:
    cd "{{root}}/compiler" && just replace

# Build beskid_vscode and reinstall into Cursor or VS Code (reload window after).
vscode:
    cd "{{root}}/compiler" && just vscode
