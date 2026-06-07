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

# Corelib spine integration tests: serial + stderr progress (use --nocapture).
test-corelib-spine:
    cd "{{root}}/compiler" && cargo test -p beskid_tests corelib_test -- --nocapture --test-threads=1
