"""Open VSX publish pipeline (aggregate repo: compiler + beskid_vscode)."""

from __future__ import annotations

import json
import os
import shutil
import stat
import subprocess
from pathlib import Path

from ci import proc
from ci import secrets


def _compiler_release_bin(compiler_root: Path, bin_name: str) -> Path:
    return compiler_root / "target" / "release" / bin_name


def _extension_publisher(vscode_root: Path) -> str:
    package_json = vscode_root / "package.json"
    data = json.loads(package_json.read_text(encoding="utf-8"))
    publisher = str(data.get("publisher", "")).strip()
    if not publisher:
        raise SystemExit(f"Missing `publisher` in {package_json}")
    return publisher


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
    proc.run(
        "bunx",
        "ovsx",
        "publish",
        "-p",
        token,
        str(vsix),
        cwd=vscode,
        env={**os.environ, "OVSX_TOKEN": token},
    )
