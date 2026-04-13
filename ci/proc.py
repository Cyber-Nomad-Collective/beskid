"""Subprocess helpers."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


def run(
    *args: str,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
) -> None:
    merged = {**os.environ, **(env or {})}
    subprocess.run(list(args), check=True, cwd=cwd, env=merged)
