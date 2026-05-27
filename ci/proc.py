"""Subprocess helpers."""

from __future__ import annotations

import os
import shlex
import subprocess
from pathlib import Path

from ci import log


def run(
    *args: str,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    label: str | None = None,
) -> None:
    merged = {**os.environ, **(env or {})}
    cmd = list(args)
    shown = shlex.join(cmd)
    prefix = f"[{label}] " if label else ""
    log.info("%sRunning: %s", prefix, shown)
    if cwd is not None:
        log.info("%s  cwd: %s", prefix, cwd)
    try:
        subprocess.run(cmd, check=True, cwd=cwd, env=merged)
    except subprocess.CalledProcessError as exc:
        log.error(
            "%sCommand failed (exit %s): %s",
            prefix,
            exc.returncode,
            shown,
        )
        raise SystemExit(exc.returncode) from exc
