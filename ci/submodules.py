"""Git submodule helpers for the aggregate repository."""

from __future__ import annotations

import os
from pathlib import Path

from ci import log
from ci import proc


def init_compiler(repo_root: Path | None = None) -> None:
    root = repo_root or Path.cwd()
    log.info("Submodule init: compiler (root=%s)", root)
    proc.run("git", "submodule", "sync", "--", "compiler", cwd=root, label="submodule")
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
    proc.run("git", "config", "submodule.compiler.url", url, cwd=root, label="submodule")
    proc.run(
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
        cwd=root,
        label="submodule",
    )
    log.info("Submodule compiler ready: %s", root / "compiler")


def init_beskid_vscode(
    repo_root: Path | None = None,
    *,
    submodule_url: str | None = None,
) -> None:
    root = repo_root or Path.cwd()
    log.info("Submodule init: beskid_vscode (root=%s)", root)
    proc.run("git", "submodule", "sync", "--", "beskid_vscode", cwd=root, label="submodule")
    url = submodule_url or os.environ.get(
        "BESKID_VSCODE_SUBMODULE_URL",
        "https://github.com/Cyber-Nomad-Collective/beskid_vscode.git",
    )
    token = os.environ.get("BESKID_VSCODE_SUBMODULE_TOKEN", "").strip()
    if token:
        url = (
            "https://x-access-token:"
            f"{token}@github.com/Cyber-Nomad-Collective/beskid_vscode.git"
        )
    proc.run(
        "git",
        "config",
        "submodule.beskid_vscode.url",
        url,
        cwd=root,
        label="submodule",
    )
    proc.run(
        "git",
        "-c",
        "protocol.version=2",
        "submodule",
        "update",
        "--init",
        "--depth",
        "1",
        "beskid_vscode",
        cwd=root,
        label="submodule",
    )
    log.info("Submodule beskid_vscode ready: %s", root / "beskid_vscode")


def init_pckg(
    repo_root: Path | None = None,
    *,
    submodule_url: str | None = None,
) -> None:
    root = repo_root or Path.cwd()
    log.info("Submodule init: pckg (root=%s)", root)
    proc.run("git", "submodule", "sync", "--", "pckg", cwd=root, label="submodule")
    url = submodule_url or os.environ.get(
        "PCKG_SUBMODULE_URL",
        "https://github.com/Cyber-Nomad-Collective/beskid_pckg.git",
    )
    token = os.environ.get("PCKG_SUBMODULE_TOKEN", "").strip()
    if token:
        url = (
            "https://x-access-token:"
            f"{token}@github.com/Cyber-Nomad-Collective/beskid_pckg.git"
        )
    proc.run("git", "config", "submodule.pckg.url", url, cwd=root, label="submodule")
    proc.run(
        "git",
        "-c",
        "protocol.version=2",
        "submodule",
        "update",
        "--init",
        "--depth",
        "1",
        "pckg",
        cwd=root,
        label="submodule",
    )
    log.info("Submodule pckg ready: %s", root / "pckg")
