"""Environment / secret validation for CI scripts."""

from __future__ import annotations

import os

from ci import log


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        log.fatal("Missing required environment variable: %s", name)
    return value
