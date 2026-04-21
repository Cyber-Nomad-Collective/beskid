"""Git submodule helpers for the aggregate repository."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


def _run(cmd: list[str], *, cwd: Path | None = None) -> None:
    subprocess.run(cmd, check=True, cwd=cwd)


def init_compiler(repo_root: Path | None = None) -> None:
    root = repo_root or Path.cwd()
    _run(["git", "submodule", "sync", "--", "compiler"], cwd=root)
    url = os.environ.get(
        "COMPILER_SUBMODULE_URL",
        "https://github.com/Cyber-Nomad-Collective/beskid_compiler.git",
    )
    token = os.environ.get("COMPILER_SUBMODULE_TOKEN", "").strip()
    if token:
        url = (
            "https://x-access-token:"
            f"{token}@github.com/Cyber-Nomad-Collective/beskid_compiler.git"
        )
    _run(["git", "config", "submodule.compiler.url", url], cwd=root)
    _run(
        [
            "git",
            "-c",
            "protocol.version=2",
            "submodule",
            "update",
            "--init",
            "--recursive",
            "--depth",
            "1",
            "compiler",
        ],
        cwd=root,
    )


def init_pckg(
    repo_root: Path | None = None,
    *,
    submodule_url: str | None = None,
) -> None:
    root = repo_root or Path.cwd()
    _run(["git", "submodule", "sync", "--", "pckg"], cwd=root)
    url = submodule_url or os.environ.get(
        "PCKG_SUBMODULE_URL",
        "https://github.com/Cyber-Nomad-Collective/beskid_pckg.git",
    )
    _run(
        ["git", "config", "submodule.pckg.url", url],
        cwd=root,
    )
    _run(
        [
            "git",
            "-c",
            "protocol.version=2",
            "submodule",
            "update",
            "--init",
            "--depth",
            "1",
            "pckg",
        ],
        cwd=root,
    )
