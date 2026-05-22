"""Nox tasks for the beskid_templates repository."""

from __future__ import annotations

import nox


@nox.session(python=False, name="quality")
def quality(session: nox.Session) -> None:
    session.run("python", "ci/quality.py")


@nox.session(python=False, name="publish_templates")
def publish_templates(session: nox.Session) -> None:
    session.run("python", "ci/publish_templates.py")
