#!/usr/bin/env bash
# Idempotent Rust toolchain activation for native POSIX AppVeyor lanes.

activate_appveyor_rust_toolchain() {
  local cargo_home="${CARGO_HOME:-${HOME}/.cargo}"
  local cargo_env="${cargo_home}/env"

  if [[ -s "${cargo_env}" ]]; then
    # shellcheck disable=SC1090
    source "${cargo_env}"
  fi

  if ! command -v rustup >/dev/null 2>&1; then
    command -v curl >/dev/null 2>&1 || {
      echo "AppVeyor Rust bootstrap requires curl" >&2
      return 1
    }
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
      | sh -s -- -y --profile minimal --default-toolchain none
    [[ -s "${cargo_env}" ]] || {
      echo "rustup installer did not publish ${cargo_env}" >&2
      return 1
    }
    # shellcheck disable=SC1090
    source "${cargo_env}"
  fi

  command -v rustup >/dev/null 2>&1 || {
    echo "rustup is unavailable after AppVeyor bootstrap" >&2
    return 1
  }
  rustup toolchain install stable --profile minimal
  rustup default stable
  rustup component add clippy
}
