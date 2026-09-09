# Platform-specific install methods for repo-deps.json entries.
# shellcheck shell=bash

BESKID_LOCAL_BIN="${BESKID_LOCAL_BIN:-${HOME}/.local/bin}"

beskid_ensure_local_bin() {
  mkdir -p "${BESKID_LOCAL_BIN}"

  # Guardrail: never write tool binaries into the git worktree.
  # (This prevents accidental BESKID_LOCAL_BIN=./bin, which would leave `bin/` in-repo.)
  local local_bin_abs repo_root
  local_bin_abs="$(cd "${BESKID_LOCAL_BIN}" && pwd)"
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -n "${repo_root}" ]]; then
    case "${local_bin_abs}/" in
      "${repo_root}/"*) die "Refusing BESKID_LOCAL_BIN inside repo: ${local_bin_abs} (set BESKID_LOCAL_BIN to e.g. ~/.local/bin)" ;;
    esac
  fi

  path_contains_dir "${BESKID_LOCAL_BIN}" || export PATH="${BESKID_LOCAL_BIN}:${PATH}"
}

beskid_expand_path() {
  local p="$1"
  p="${p/#\~/$HOME}"
  printf '%s' "${p}"
}

# --- package managers ---

beskid_install_homebrew() {
  local formula="$1"
  note "brew install ${formula}"
  brew install "${formula}"
}

beskid_install_homebrew_cask() {
  local cask="$1"
  note "brew install --cask ${cask}"
  brew install --cask "${cask}"
}

beskid_install_apt() {
  local packages=("$@")
  note "sudo apt-get install ${packages[*]}"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "${packages[@]}"
}

beskid_install_dnf() {
  local packages=("$@")
  note "sudo dnf install ${packages[*]}"
  sudo dnf install -y "${packages[@]}"
}

beskid_install_pacman() {
  local packages=("$@")
  note "sudo pacman -S ${packages[*]}"
  sudo pacman -S --noconfirm "${packages[@]}"
}

beskid_install_snap() {
  local package="$1"
  local classic="${2:-false}"
  if [[ "${classic}" == "true" ]]; then
    note "sudo snap install ${package} --classic"
    sudo snap install "${package}" --classic
  else
    note "sudo snap install ${package}"
    sudo snap install "${package}"
  fi
}

beskid_install_winget() {
  local id="$1"
  local exact="${2:-false}"
  local exact_flag=""
  [[ "${exact}" == "true" ]] && exact_flag="--exact"
  note "winget install ${exact_flag} --id ${id}"
  if command -v winget.exe >/dev/null 2>&1; then
    winget.exe install ${exact_flag} --id "${id}" \
      --accept-package-agreements --accept-source-agreements
  elif command -v winget >/dev/null 2>&1; then
    winget install ${exact_flag} --id "${id}" \
      --accept-package-agreements --accept-source-agreements
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command \
      "winget install ${exact_flag} --id '${id}' --accept-package-agreements --accept-source-agreements"
  else
    die "winget not found"
  fi
}

beskid_install_scoop() {
  local package="$1"
  note "scoop install ${package}"
  scoop install "${package}"
}

beskid_install_choco() {
  local package="$1"
  note "choco install ${package}"
  choco install -y "${package}"
}

# --- scripts / binaries ---

beskid_install_script() {
  local url="$1"
  shift
  local args=("$@")
  note "curl -fsSL ${url}"
  if [[ ${#args[@]} -gt 0 ]]; then
    curl -fsSL "${url}" | bash -s -- "${args[@]}"
  else
    curl -fsSL "${url}" | bash
  fi
}

beskid_install_rustup() {
  note "rustup (https://rustup.rs)"
  if [[ "${BESKID_OS}" == "windows" ]]; then
    if command -v winget.exe >/dev/null 2>&1; then
      beskid_install_winget "Rustlang.Rustup" true && return 0
    fi
    die "Install rustup from https://rustup.rs on Windows"
  fi
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
  # shellcheck disable=SC1091
  [[ -f "${HOME}/.cargo/env" ]] && source "${HOME}/.cargo/env"
}

beskid_install_bun() {
  note "bun installer (https://bun.sh)"
  if [[ "${BESKID_OS}" == "windows" ]]; then
    powershell.exe -NoProfile -Command "irm bun.sh/install.ps1 | iex"
  else
    curl -fsSL https://bun.sh/install | bash
  fi
}

beskid_sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${path}" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${path}" | awk '{print $1}'
  else
    die "sha256sum or shasum is required to verify downloaded tools"
  fi
}

beskid_install_cargo_binstall_bootstrap() {
  local version="$1"
  local target="$2"
  local expected_sha256="$3"
  [[ "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "Invalid cargo-binstall version: ${version}"
  [[ "${target}" =~ ^[A-Za-z0-9_-]+$ ]] || die "Invalid cargo-binstall target: ${target}"
  [[ "${expected_sha256}" =~ ^[0-9a-f]{64}$ ]] || die "Invalid cargo-binstall sha256"

  local extension="tgz"
  [[ "${BESKID_OS}" == "darwin" || "${BESKID_OS}" == "windows" ]] && extension="zip"
  local asset="cargo-binstall-${target}.${extension}"
  local url="https://github.com/cargo-bins/cargo-binstall/releases/download/v${version}/${asset}"
  local tmp archive actual_sha256 bin_name found
  tmp="$(mktemp -d)"
  archive="${tmp}/${asset}"

  note "cargo-binstall ${version} verified prebuilt asset (${target})"
  curl --proto '=https' --tlsv1.2 -fsSL -o "${archive}" "${url}"
  actual_sha256="$(beskid_sha256_file "${archive}")"
  [[ "${actual_sha256}" == "${expected_sha256}" ]] \
    || die "cargo-binstall checksum mismatch: expected ${expected_sha256}, got ${actual_sha256}"

  if [[ "${extension}" == "zip" ]]; then
    unzip -q -o "${archive}" -d "${tmp}"
  else
    tar -xzf "${archive}" -C "${tmp}"
  fi

  bin_name="cargo-binstall"
  [[ "${BESKID_OS}" == "windows" ]] && bin_name="cargo-binstall.exe"
  found="$(find "${tmp}" -type f -name "${bin_name}" 2>/dev/null | head -n1)"
  [[ -n "${found}" ]] || die "Binary ${bin_name} not found in ${asset}"
  beskid_ensure_local_bin
  install -m 0755 "${found}" "${BESKID_LOCAL_BIN}/${bin_name}"
  rm -rf "${tmp}"
  ok "Installed ${bin_name} -> ${BESKID_LOCAL_BIN}/${bin_name}"
}

beskid_install_github_release() {
  local repo="$1"
  local asset_glob="$2"
  local bin_name="$3"

  command -v jq >/dev/null 2>&1 || die "jq required for github_release install"
  beskid_ensure_local_bin

  local api="https://api.github.com/repos/${repo}/releases/latest"
  note "GitHub release: ${repo} (${asset_glob})"
  local asset_url
  local pattern="${asset_glob//\*/.*}"
  asset_url="$(curl -fsSL "${api}" | jq -r --arg re "${pattern}" '
    .assets[] | select(.name | test($re)) | .browser_download_url' | head -n1)"
  [[ -n "${asset_url}" && "${asset_url}" != "null" ]] || die "No asset matching ${asset_glob} on ${repo}"

  local tmp
  tmp="$(mktemp -d)"
  local archive="${tmp}/asset"
  curl -fsSL -o "${archive}" "${asset_url}"

  case "${asset_url}" in
    *.zip)
      unzip -q -o "${archive}" -d "${tmp}"
      ;;
    *.tar.gz | *.tgz)
      tar -xzf "${archive}" -C "${tmp}"
      ;;
    *)
      die "Unsupported archive: ${asset_url}"
      ;;
  esac

  local found
  found="$(find "${tmp}" -type f -name "${bin_name}" 2>/dev/null | head -n1)"
  [[ -n "${found}" ]] || die "Binary ${bin_name} not found in archive"
  install -m 0755 "${found}" "${BESKID_LOCAL_BIN}/${bin_name}"
  ok "Installed ${bin_name} → ${BESKID_LOCAL_BIN}/${bin_name}"
  rm -rf "${tmp}"
}

# Dispatch one method object from repo-deps (JSON string on stdin).
beskid_run_install_method() {
  local method
  method="$(jq -r '.method' <<<"$1")"

  case "${method}" in
    homebrew)
      beskid_install_homebrew "$(jq -r '.formula' <<<"$1")"
      ;;
    homebrew_cask)
      beskid_install_homebrew_cask "$(jq -r '.cask' <<<"$1")"
      ;;
    apt)
      local -a pkgs=()
      beskid_read_array pkgs jq -r '.packages[]' <<<"$1"
      beskid_install_apt "${pkgs[@]}"
      ;;
    dnf)
      local -a pkgs=()
      beskid_read_array pkgs jq -r '.packages[]' <<<"$1"
      beskid_install_dnf "${pkgs[@]}"
      ;;
    pacman)
      local -a pkgs=()
      beskid_read_array pkgs jq -r '.packages[]' <<<"$1"
      beskid_install_pacman "${pkgs[@]}"
      ;;
    snap)
      beskid_install_snap "$(jq -r '.package' <<<"$1")" "$(jq -r '.classic // false' <<<"$1")"
      ;;
    winget)
      beskid_install_winget "$(jq -r '.id' <<<"$1")" "$(jq -r '.exact // false' <<<"$1")"
      ;;
    scoop)
      beskid_install_scoop "$(jq -r '.package' <<<"$1")"
      ;;
    choco)
      beskid_install_choco "$(jq -r '.package' <<<"$1")"
      ;;
    script)
      local url
      local -a script_args=()
      url="$(jq -r '.url' <<<"$1")"
      beskid_read_array script_args jq -r '.args[]? // empty' <<<"$1"
      # Expand ~ in args
      local expanded=()
      local a
      for a in "${script_args[@]}"; do
        expanded+=("$(beskid_expand_path "${a}")")
      done
      beskid_install_script "${url}" "${expanded[@]}"
      ;;
    rustup)
      beskid_install_rustup
      ;;
    bun_installer)
      beskid_install_bun
      ;;
    cargo_binstall_bootstrap)
      local asset_target asset_sha256
      asset_target="$(jq -r --arg arch "${BESKID_ARCH}" '.assets[$arch].target // empty' <<<"$1")"
      asset_sha256="$(jq -r --arg arch "${BESKID_ARCH}" '.assets[$arch].sha256 // empty' <<<"$1")"
      [[ -n "${asset_target}" && -n "${asset_sha256}" ]] \
        || die "No cargo-binstall asset for ${BESKID_OS}/${BESKID_ARCH}"
      beskid_install_cargo_binstall_bootstrap \
        "$(jq -r '.version' <<<"$1")" "${asset_target}" "${asset_sha256}"
      ;;
    github_release)
      beskid_install_github_release \
        "$(jq -r '.repo' <<<"$1")" \
        "$(jq -r '.asset_glob' <<<"$1")" \
        "$(jq -r '.bin' <<<"$1")"
      ;;
    *)
      die "Unknown install method: ${method}"
      ;;
  esac
}

beskid_method_available() {
  local method="$1"
  case "${method}" in
    homebrew | homebrew_cask) command -v brew >/dev/null 2>&1 ;;
    apt) command -v apt-get >/dev/null 2>&1 ;;
    dnf) command -v dnf >/dev/null 2>&1 ;;
    pacman) command -v pacman >/dev/null 2>&1 ;;
    snap) command -v snap >/dev/null 2>&1 ;;
    winget) command -v winget.exe >/dev/null 2>&1 || command -v winget >/dev/null 2>&1 ;;
    scoop) command -v scoop >/dev/null 2>&1 ;;
    choco) command -v choco >/dev/null 2>&1 ;;
    script | rustup | bun_installer | github_release) command -v curl >/dev/null 2>&1 ;;
    cargo_binstall_bootstrap)
      command -v curl >/dev/null 2>&1 \
        && { command -v sha256sum >/dev/null 2>&1 || command -v shasum >/dev/null 2>&1; }
      ;;
    *) return 1 ;;
  esac
}
