# Beskid superrepo — common tasks.
#
#   just setup     Interactive checkout setup (site wizard)
#   just deps      Check toolchain from repo-deps.json

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
