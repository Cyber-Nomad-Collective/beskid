"""Open VSX publish pipeline (aggregate repo: compiler + beskid_vscode)."""

from __future__ import annotations

import os
import shutil
import stat
from pathlib import Path

from ci import proc
from ci import secrets


def _compiler_release_bin(compiler_root: Path, bin_name: str) -> Path:
    return compiler_root / "target" / "release" / bin_name


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
