# Beskid superrepo — common tasks.
#
#   just setup     Interactive checkout setup (site wizard)
#   just deps      Check toolchain from repo-deps.json
#   just test-corelib-spine  Slow corelib spine tests with live progress

set shell := ["bash", "-euo", "pipefail", "-c"]

root := justfile_directory()

default:
    @just --list

# Interactive repo setup (submodules, toolchain, site/auth env, bun install).
setup:
    "{{root}}/site/setup-wizard.sh"

deps-check:
    "{{root}}/scripts/install-deps.sh" --check --group beskid

deps-install:
    "{{root}}/scripts/install-deps.sh" --install --group beskid

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
