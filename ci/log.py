"""Structured logging for superrepo CI invoked from Nox or GitHub Actions."""

from __future__ import annotations

import logging
import sys
from typing import NoReturn

_LOGGER_NAME = "beskid.ci"
_configured = False


def _logger() -> logging.Logger:
    global _configured
    log = logging.getLogger(_LOGGER_NAME)
    if not _configured:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter("[%(levelname)s] beskid.ci: %(message)s"))
        log.handlers.clear()
        log.addHandler(handler)
        log.setLevel(logging.INFO)
        log.propagate = False
        _configured = True
    return log


def info(msg: str, *args: object) -> None:
    _logger().info(msg, *args)


def warning(msg: str, *args: object) -> None:
    _logger().warning(msg, *args)


def error(msg: str, *args: object) -> None:
    _logger().error(msg, *args)


def fatal(msg: str, *args: object, code: int = 1) -> NoReturn:
    error(msg, *args)
    raise SystemExit(code)
