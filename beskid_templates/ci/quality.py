"""Quality checks for the Beskid first-party templates workspace."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_MANIFEST = ROOT / "Workspace.proj"
WORKSPACE_PACKAGE_JSON = ROOT / "workspace.package.json"

TEMPLATE_MEMBERS: tuple[tuple[str, str, str, str], ...] = (
    ("console", "packages/console", "beskid-templates-console", "beskid.templates.console"),
    ("lib", "packages/lib", "beskid-templates-lib", "beskid.templates.lib"),
    ("project", "packages/project", "beskid-templates-project", "beskid.templates.project"),
    (
        "workspace_demo",
        "packages/workspace-demo",
        "beskid-templates-workspace-demo",
        "beskid.templates.workspace-demo",
    ),
    (
        "contract_item",
        "packages/contract-item",
        "beskid-templates-contract-item",
        "beskid.templates.contract-item",
    ),
)

FORBIDDEN_CORELIB_OPTOUT = re.compile(
    r"\b(noCorelib|useCorelib\s*:\s*false)\b",
    re.IGNORECASE,
)

REQUIRED_TEMPLATE_KEYS = frozenset(
    {"schema", "identity", "name", "shortName"},
)

VALID_TAG_TYPES = frozenset({"project", "workspace", "item"})


def _project_field(content: str, key: str) -> str | None:
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        current_key, value = line.split("=", 1)
        if current_key.strip() == key:
            return value.strip().strip('"')
    return None


def _load_template_json(path: Path) -> dict[str, object]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON: {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise SystemExit(f"template.json root must be an object: {path}")
    return data


def _validate_template_manifest(path: Path, expected_identity_prefix: str) -> None:
    data = _load_template_json(path)
    schema = data.get("schema")
    if schema != "beskid.template.v1":
        raise SystemExit(f"{path}: schema must be beskid.template.v1, got {schema!r}")

    missing = REQUIRED_TEMPLATE_KEYS - set(data)
    if missing:
        raise SystemExit(f"{path}: missing required keys: {sorted(missing)}")

    identity = str(data["identity"])
    if not identity.startswith(expected_identity_prefix):
        raise SystemExit(
            f"{path}: identity must start with {expected_identity_prefix!r}, got {identity!r}"
        )

    tags = data.get("tags")
    if isinstance(tags, dict):
        tag_type = tags.get("type")
        if tag_type not in VALID_TAG_TYPES:
            raise SystemExit(f"{path}: tags.type must be one of {sorted(VALID_TAG_TYPES)}, got {tag_type!r}")

    symbols = data.get("symbols")
    if symbols is not None and not isinstance(symbols, dict):
        raise SystemExit(f"{path}: symbols must be an object when present")

    sources = data.get("sources")
    if sources is not None:
        if not isinstance(sources, list):
            raise SystemExit(f"{path}: sources must be an array when present")
        for index, entry in enumerate(sources):
            if not isinstance(entry, dict):
                raise SystemExit(f"{path}: sources[{index}] must be an object")


def _scan_forbidden_corelib_optout(directory: Path) -> None:
    if not directory.is_dir():
        return
    for path in directory.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in {".proj", ".bd", ".md", ".json"}:
            continue
        if path.name == "template.json" and ".beskid" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if FORBIDDEN_CORELIB_OPTOUT.search(text):
            raise SystemExit(f"Forbidden corelib opt-out in generated content: {path}")


def main() -> None:
    if not WORKSPACE_MANIFEST.is_file():
        raise SystemExit(f"Missing workspace manifest: {WORKSPACE_MANIFEST}")
    if not WORKSPACE_PACKAGE_JSON.is_file():
        raise SystemExit(f"Missing workspace publish metadata: {WORKSPACE_PACKAGE_JSON}")

    workspace_text = WORKSPACE_MANIFEST.read_text(encoding="utf-8")
    if _project_field(workspace_text, "name") != "beskid_templates":
        raise SystemExit("Workspace.proj name must be beskid_templates")

    workspace_package = json.loads(WORKSPACE_PACKAGE_JSON.read_text(encoding="utf-8"))
    if workspace_package.get("schema") != "beskid.workspace.package.v1":
        raise SystemExit("workspace.package.json schema must be beskid.workspace.package.v1")
    members = workspace_package.get("members")
    if not isinstance(members, dict):
        raise SystemExit("workspace.package.json must declare members")

    for member_id, source_rel, project_name, registry_id in TEMPLATE_MEMBERS:
        member_root = ROOT / source_rel
        manifest = member_root / "Project.proj"
        template_json = member_root / ".beskid" / "template.json"
        if not manifest.is_file():
            raise SystemExit(f"Missing Project.proj: {manifest}")
        if not template_json.is_file():
            raise SystemExit(f"Missing template manifest: {template_json}")

        proj = manifest.read_text(encoding="utf-8")
        if _project_field(proj, "name") != project_name:
            raise SystemExit(f"{manifest}: project.name must be {project_name!r}")
        if _project_field(proj, "type") != "Template":
            raise SystemExit(f"{manifest}: project.type must be Template")

        meta = members.get(member_id)
        if not isinstance(meta, dict):
            raise SystemExit(f"workspace.package.json missing member {member_id!r}")
        if meta.get("package") != registry_id:
            raise SystemExit(
                f"workspace.package.json[{member_id}].package must be {registry_id!r}, "
                f"got {meta.get('package')!r}"
            )

        _validate_template_manifest(template_json, registry_id)

        for child in member_root.iterdir():
            if child.name in {".beskid", "Project.proj"}:
                continue
            if child.is_dir():
                _scan_forbidden_corelib_optout(child)

    print(f"quality OK: {len(TEMPLATE_MEMBERS)} template member(s)")


if __name__ == "__main__":
    main()
