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

from ci import log
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


def _compiler_release_bin(
    compiler_root: Path, bin_name: str, *, rust_triple: str | None
) -> Path:
    if rust_triple:
        return compiler_root / "target" / rust_triple / "release" / bin_name
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
        log.fatal("Missing `icon` in %s", package_json)

    icon_path = vscode_root / icon_rel
    if not icon_path.is_file():
        log.fatal("Extension icon file not found: %s", icon_path)
    if icon_path.suffix.lower() == ".svg":
        log.fatal(
            "Extension icon must be PNG/JPG for VSCE/Open VSX (found SVG): %s",
            icon_path,
        )


def _extension_publisher(vscode_root: Path) -> str:
    package_json, data = _read_extension_manifest(vscode_root)
    publisher = str(data.get("publisher", "")).strip()
    if not publisher:
        log.fatal("Missing `publisher` in %s", package_json)
    return publisher


def _git_out(*args: str) -> str:
    try:
        return subprocess.check_output(["git", *args], text=True).strip()
    except subprocess.CalledProcessError as exc:
        log.error("git command failed (exit %s): git %s", exc.returncode, " ".join(args))
        raise SystemExit(exc.returncode) from exc


def _resolved_extension_version() -> str | None:
    def _split(tag: str) -> tuple[int, int, int]:
        match = TAG_RE.match(tag)
        if not match:
            log.fatal("Tag `%s` is not semver (expected vMAJOR.MINOR.PATCH)", tag)
        major, minor, patch = match.groups()
        return int(major), int(minor), int(patch)

    tag_ref = os.environ.get("GITHUB_REF_NAME", "").strip()
    if os.environ.get("GITHUB_REF_TYPE", "").strip() == "tag" and TAG_RE.match(tag_ref):
        return tag_ref.removeprefix("v")

    latest_tag = _git_out("describe", "--tags", "--abbrev=0", "--match", "v[0-9]*.[0-9]*.[0-9]*")
    major, minor, patch = _split(latest_tag)
    commits_since = int(_git_out("rev-list", "--count", f"{latest_tag}..HEAD"))
    if commits_since <= 0:
        return f"{major}.{minor}.{patch}"
    return f"{major}.{minor}.{patch + commits_since}"


def _apply_extension_version(vscode_root: Path) -> str | None:
    target = _resolved_extension_version()
    if not target:
        return None
    if not SEMVER_RE.match(target):
        log.fatal(
            "Derived extension version `%s` is not valid semver. "
            "Use tag format vMAJOR.MINOR.PATCH for release builds.",
            target,
        )

    package_json, data = _read_extension_manifest(vscode_root)
    current = str(data.get("version", "")).strip()
    if current == target:
        log.info("Open VSX: using extension version %s", current)
        return current
    data["version"] = target
    _write_extension_manifest(package_json, data)
    log.info("Open VSX: overriding extension version %s -> %s", current, target)
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

    stdout = result.stdout.decode("utf-8", errors="replace")
    stderr = result.stderr.decode("utf-8", errors="replace")
    output = f"{stdout}\n{stderr}".lower()
    if "already exists" in output:
        return

    log.error(
        "Open VS X namespace setup failed for publisher `%s`. "
        "Ensure your token can manage that namespace.",
        publisher,
    )
    log.error("create-namespace output:\n%s\n%s", stdout, stderr)
    raise SystemExit(1)


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
                log.info(
                    "Open VS X: publish succeeded on retry %s/%s",
                    attempt,
                    max_attempts,
                )
            return

        stdout = result.stdout.decode("utf-8", errors="replace")
        stderr = result.stderr.decode("utf-8", errors="replace")
        combined = f"{stdout}\n{stderr}"
        retryable = RETRYABLE_PUBLISH_RE.search(combined) is not None
        if attempt < max_attempts and retryable:
            delay = base_delay_s * (2 ** (attempt - 1))
            log.warning(
                "Open VS X: publish attempt %s/%s failed with transient error; "
                "retrying in %ss...",
                attempt,
                max_attempts,
                delay,
            )
            time.sleep(delay)
            continue
        log.error(
            "Open VS X: publish failed after %s attempt(s). Output follows.",
            attempt,
        )
        log.error("%s", combined)
        raise SystemExit(1)


def bundle_and_publish(
    repo_root: Path,
    *,
    platform: str,
    bin_name: str,
    rust_triple: str | None = None,
) -> None:
    token = secrets.require_env("OVSX_TOKEN")
    compiler = repo_root / "compiler"
    vscode = repo_root / "beskid_vscode"
    bin_src = _compiler_release_bin(compiler, bin_name, rust_triple=rust_triple)
    if not bin_src.is_file():
        log.fatal("Missing LSP binary: %s", bin_src)

    log.info(
        "Open VS X: bundling %s for platform=%s (vscode root=%s)",
        bin_name,
        platform,
        vscode,
    )

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
        proc.run("bun", "install", "--frozen-lockfile", cwd=vscode, label="open-vsx")
        proc.run("bun", "run", "build", cwd=vscode, label="open-vsx")
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
            label="open-vsx",
        )
        _publish_openvsx_with_retry(vscode, token, vsix)
    finally:
        _restore_extension_version(vscode, previous_version)
