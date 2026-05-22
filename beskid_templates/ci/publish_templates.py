"""Publish the Beskid templates workspace to pckg (skeleton).

Mirrors compiler/corelib/ci/publish_corelib.py. Full implementation is blocked on:
- CLI `beskid pckg pack` emitting packageKind: template for type Template projects
- pckg workspace publish accepting template packageKind without api.json
- Optional `beskid new` round-trip CI (instantiate → lock → build)
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_MANIFEST = ROOT / "Workspace.proj"
WORKSPACE_PACKAGE_JSON = ROOT / "workspace.package.json"
REPOSITORY_BASE = "https://github.com/Cyber-Nomad-Collective/beskid_templates/tree/main"


@dataclass(frozen=True)
class WorkspacePackageMeta:
    registry_name: str
    member_id: str
    source_rel: str
    description: str
    tags: tuple[str, ...]


WORKSPACE_PACKAGES: tuple[WorkspacePackageMeta, ...] = (
    WorkspacePackageMeta(
        "beskid.templates.console",
        "console",
        "packages/console",
        "Executable console application with App target and Main.bd entry.",
        ("template", "beskid", "console", "app", "project"),
    ),
    WorkspacePackageMeta(
        "beskid.templates.lib",
        "lib",
        "packages/lib",
        "Class library project with Lib target.",
        ("template", "beskid", "library", "project"),
    ),
    WorkspacePackageMeta(
        "beskid.templates.project",
        "project",
        "packages/project",
        "Template authoring package (type Template) with stub template.json.",
        ("template", "beskid", "authoring", "project"),
    ),
    WorkspacePackageMeta(
        "beskid.templates.workspace-demo",
        "workspace_demo",
        "packages/workspace-demo",
        "Two-member workspace scaffold (app + lib).",
        ("template", "beskid", "workspace"),
    ),
    WorkspacePackageMeta(
        "beskid.templates.contract-item",
        "contract_item",
        "packages/contract-item",
        "Contract file item template for existing projects.",
        ("template", "beskid", "contract", "item"),
    ),
)


def _require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def _project_field(content: str, key: str) -> str | None:
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        current_key, value = line.split("=", 1)
        if current_key.strip() == key:
            return value.strip().strip('"')
    return None


def _validate_workspace_packages(workspace_root: Path) -> None:
    workspace_text = (workspace_root / "Workspace.proj").read_text(encoding="utf-8")
    workspace_name = _project_field(workspace_text, "name")
    if workspace_name != "beskid_templates":
        raise SystemExit(f"Workspace.proj name must be 'beskid_templates', got {workspace_name!r}")

    workspace_package = json.loads(
        (workspace_root / "workspace.package.json").read_text(encoding="utf-8")
    )
    members = workspace_package.get("members")
    if not isinstance(members, dict):
        raise SystemExit("workspace.package.json must declare members")

    for meta in WORKSPACE_PACKAGES:
        manifest = workspace_root / meta.source_rel / "Project.proj"
        template_json = workspace_root / meta.source_rel / ".beskid" / "template.json"
        if not manifest.is_file():
            raise SystemExit(f"Missing Project.proj for {meta.registry_name}: {manifest}")
        if not template_json.is_file():
            raise SystemExit(f"Missing .beskid/template.json for {meta.registry_name}: {template_json}")
        if _project_field(manifest.read_text(encoding="utf-8"), "type") != "Template":
            raise SystemExit(f"{manifest}: project.type must be Template")
        member_meta = members.get(meta.member_id)
        if not isinstance(member_meta, dict) or member_meta.get("package") != meta.registry_name:
            raise SystemExit(
                f"workspace.package.json member {meta.member_id!r} must map to {meta.registry_name!r}"
            )


def main() -> None:
    _require("BESKID_PCKG_API_KEY")
    workspace_root = Path(os.environ.get("BESKID_TEMPLATES_ROOT", str(ROOT))).resolve()
    _validate_workspace_packages(workspace_root)

    print(
        "[publish] skeleton only: workspace bundle upload not implemented yet.",
        file=sys.stderr,
    )
    print(
        "[publish] blockers: beskid pckg pack (packageKind template), "
        "pckg template validator profile, workspace publish for template members.",
        file=sys.stderr,
    )
    for meta in WORKSPACE_PACKAGES:
        print(f"[publish] would publish {meta.registry_name} from {REPOSITORY_BASE}/{meta.source_rel}")

    raise SystemExit(
        "publish_templates.py is a stub; implement pack/upload when CLI and pckg support template packages."
    )


if __name__ == "__main__":
    main()
