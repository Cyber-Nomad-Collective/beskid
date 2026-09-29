#!/usr/bin/env bash
# Reject local source inputs that are absent from the pinned Git tree.
# Generated obj/target and .beskid/cache trees may survive a previous build.
set -euo pipefail
[[ "$#" == 2 ]] || { echo 'usage: release-source-inventory.sh <repo> <root|compiler|corelib|bsol>' >&2; exit 2; }
repo="$1"
profile="$2"
case "$profile" in root|compiler|corelib|bsol) ;; *) echo 'invalid release source profile' >&2; exit 2 ;; esac
[[ "$(git -C "$repo" rev-parse --is-inside-work-tree)" == true ]] || {
  echo 'release source inventory requires a Git checkout' >&2; exit 2;
}

source_path() {
  local path="$1"
  case "$path" in
    obj/*|*/obj/*|target/*|*/target/*|.beskid/cache/*|*/.beskid/cache/*) return 1 ;;
  esac
  case "$profile:$path" in
    root:scripts/ci/*|root:.woodpecker/*|root:Cargo.toml|root:Cargo.lock) return 0 ;;
    compiler:crates/*|compiler:vendor/*|compiler:compiler/*|compiler:beskid_quality/*|compiler:runtime/*|compiler:scripts/*|compiler:.cargo/*|compiler:Cargo.toml|compiler:Cargo.lock|compiler:runtime_manifest.bsol|compiler:rust-toolchain.toml) return 0 ;;
    corelib:packages/*|corelib:mods/*|corelib:beskid_corelib/*|corelib:templates/*|corelib:scripts/*|corelib:CoreLib.bws) return 0 ;;
    bsol:crates/*|bsol:grammars/*|bsol:schemas/*|bsol:scripts/*|bsol:Cargo.toml|bsol:Cargo.lock) return 0 ;;
  esac
  return 1
}

scan() {
  local kind="$1" path
  local arguments=(--others --exclude-standard -z)
  [[ "$kind" == ignored ]] && arguments+=(--ignored)
  while IFS= read -r -d '' path; do
    if source_path "$path"; then
      echo "release source inventory rejects $kind $profile input: $path" >&2
      return 1
    fi
  done < <(git -C "$repo" ls-files "${arguments[@]}")
}

scan untracked
scan ignored
