"""Open VSX publish pipeline (aggregate repo: compiler + beskid_vscode)."""

from __future__ import annotations

import json
import os
import re
import shutil
import stat
import subprocess
import time
from pathlib import Path

from ci import proc
from ci import secrets


SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)
TAG_RE = re.compile(r"^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")
RETRYABLE_PUBLISH_RE = re.compile(
    r"(status\s+50\d|bad gateway|gateway timeout|timed out|econnreset|econnrefused|service unavailable)",
    re.IGNORECASE,
)


def _compiler_release_bin(compiler_root: Path, bin_name: str) -> Path:
    return compiler_root / "target" / "release" / bin_name


def _read_extension_manifest(vscode_root: Path) -> tuple[Path, dict[str, object]]:
    package_json = vscode_root / "package.json"
    data = json.loads(package_json.read_text(encoding="utf-8"))
    return package_json, data


def _write_extension_manifest(package_json: Path, data: dict[str, object]) -> None:
    package_json.write_text(f"{json.dumps(data, indent=2)}\n", encoding="utf-8")


def _validate_extension_icon(vscode_root: Path) -> None:
    package_json, data = _read_extension_manifest(vscode_root)
    icon_rel = str(data.get("icon", "")).strip()
    if not icon_rel:
        raise SystemExit(f"Missing `icon` in {package_json}")

    icon_path = vscode_root / icon_rel
    if not icon_path.is_file():
        raise SystemExit(f"Extension icon file not found: {icon_path}")
    if icon_path.suffix.lower() == ".svg":
        raise SystemExit(
            f"Extension icon must be PNG/JPG for VSCE/Open VSX (found SVG): {icon_path}"
        )


def _extension_publisher(vscode_root: Path) -> str:
    package_json, data = _read_extension_manifest(vscode_root)
    publisher = str(data.get("publisher", "")).strip()
    if not publisher:
        raise SystemExit(f"Missing `publisher` in {package_json}")
    return publisher


def _resolved_extension_version() -> str | None:
    def _git(*args: str) -> str:
        return subprocess.check_output(["git", *args], text=True).strip()

    def _split(tag: str) -> tuple[int, int, int]:
        match = TAG_RE.match(tag)
        if not match:
            raise SystemExit(f"Tag `{tag}` is not semver (expected vMAJOR.MINOR.PATCH)")
        major, minor, patch = match.groups()
        return int(major), int(minor), int(patch)

    tag_ref = os.environ.get("GITHUB_REF_NAME", "").strip()
    if os.environ.get("GITHUB_REF_TYPE", "").strip() == "tag" and TAG_RE.match(tag_ref):
        return tag_ref.removeprefix("v")

    latest_tag = _git("describe", "--tags", "--abbrev=0", "--match", "v[0-9]*.[0-9]*.[0-9]*")
    major, minor, patch = _split(latest_tag)
    commits_since = int(_git("rev-list", "--count", f"{latest_tag}..HEAD"))
    if commits_since <= 0:
        return f"{major}.{minor}.{patch}"
    return f"{major}.{minor}.{patch + commits_since}"


def _apply_extension_version(vscode_root: Path) -> str | None:
    target = _resolved_extension_version()
    if not target:
        return None
    if not SEMVER_RE.match(target):
        raise SystemExit(
            f"Derived extension version `{target}` is not valid semver. "
            "Use tag format vMAJOR.MINOR.PATCH for release builds."
        )

    package_json, data = _read_extension_manifest(vscode_root)
    current = str(data.get("version", "")).strip()
    if current == target:
        print(f"[open-vsx] Using extension version {current}")
        return current
    data["version"] = target
    _write_extension_manifest(package_json, data)
    print(f"[open-vsx] Overriding extension version {current} -> {target}")
    return current or None


def _restore_extension_version(vscode_root: Path, previous: str | None) -> None:
    if previous is None:
        return
    package_json, data = _read_extension_manifest(vscode_root)
    data["version"] = previous
    _write_extension_manifest(package_json, data)


def _ensure_openvsx_namespace(vscode_root: Path, token: str) -> None:
    publisher = _extension_publisher(vscode_root)
    result = subprocess.run(
        ["bunx", "ovsx", "create-namespace", publisher, "-p", token],
        cwd=vscode_root,
        capture_output=True,
    )
    if result.returncode == 0:
        return

    # Decode tool output explicitly to avoid Windows codepage decode crashes.
    stdout = result.stdout.decode("utf-8", errors="replace")
    stderr = result.stderr.decode("utf-8", errors="replace")
    output = f"{stdout}\n{stderr}".lower()
    if "already exists" in output:
        return

    raise SystemExit(
        "Open VSX namespace setup failed for publisher "
        f"`{publisher}`. Ensure your token can manage that namespace.\n"
        f"create-namespace output:\n{stdout}{stderr}"
    )


def _publish_openvsx_with_retry(vscode_root: Path, token: str, vsix: Path) -> None:
    max_attempts = 4
    base_delay_s = 3
    for attempt in range(1, max_attempts + 1):
        result = subprocess.run(
            ["bunx", "ovsx", "publish", "-p", token, str(vsix)],
            cwd=vscode_root,
            capture_output=True,
            env={**os.environ, "OVSX_TOKEN": token},
        )
        if result.returncode == 0:
            if attempt > 1:
                print(f"[open-vsx] Publish succeeded on retry {attempt}/{max_attempts}")
            return

        stdout = result.stdout.decode("utf-8", errors="replace")
        stderr = result.stderr.decode("utf-8", errors="replace")
        combined = f"{stdout}\n{stderr}"
        retryable = RETRYABLE_PUBLISH_RE.search(combined) is not None
        if attempt < max_attempts and retryable:
            delay = base_delay_s * (2 ** (attempt - 1))
            print(
                f"[open-vsx] Publish attempt {attempt}/{max_attempts} failed with transient "
                f"error; retrying in {delay}s..."
            )
            time.sleep(delay)
            continue
        raise SystemExit(
            f"Open VSX publish failed after {attempt} attempt(s).\n"
            f"publish output:\n{combined}"
        )


def bundle_and_publish(
    repo_root: Path,
    *,
    platform: str,
    bin_name: str,
) -> None:
    token = secrets.require_env("OVSX_TOKEN")
    compiler = repo_root / "compiler"
    vscode = repo_root / "beskid_vscode"
    bin_src = _compiler_release_bin(compiler, bin_name)
    if not bin_src.is_file():
        raise SystemExit(f"Missing LSP binary: {bin_src}")

    server_dir = vscode / "server" / platform
    server_dir.mkdir(parents=True, exist_ok=True)
    bin_dst = server_dir / bin_name
    shutil.copy2(bin_src, bin_dst)
    if not platform.startswith("win32"):
        mode = bin_dst.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH
        bin_dst.chmod(mode)

    previous_version = _apply_extension_version(vscode)
    try:
        _validate_extension_icon(vscode)
        proc.run("bun", "install", "--frozen-lockfile", cwd=vscode)
        proc.run("bun", "run", "build", cwd=vscode)
        _ensure_openvsx_namespace(vscode, token)
        dist = vscode / "dist"
        dist.mkdir(parents=True, exist_ok=True)
        vsix = dist / f"beskid-{platform}.vsix"
        proc.run(
            "bunx",
            "@vscode/vsce",
            "package",
            "--target",
            platform,
            "--out",
            str(vsix),
            cwd=vscode,
        )
        _publish_openvsx_with_retry(vscode, token, vsix)
    finally:
        _restore_extension_version(vscode, previous_version)
