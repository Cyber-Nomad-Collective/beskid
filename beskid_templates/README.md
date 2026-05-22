# Beskid project templates

First-party [`beskid.template.v1`](https://beskid-lang.org/platform-spec/tooling/project-scaffolding/project-templates/design-model/) packages published under the **`beskid.templates.*`** registry namespace.

Repository: [Cyber-Nomad-Collective/beskid_templates](https://github.com/Cyber-Nomad-Collective/beskid_templates)

## Layout

| Path | Registry id | CLI `shortName` | `tags.type` |
| --- | --- | --- | --- |
| `packages/console` | `beskid.templates.console` | `console` | `project` |
| `packages/lib` | `beskid.templates.lib` | `lib` | `project` |
| `packages/project` | `beskid.templates.project` | `template` | `project` |
| `packages/workspace-demo` | `beskid.templates.workspace-demo` | `workspace-demo` | `workspace` |
| `packages/contract-item` | `beskid.templates.contract-item` | `contract` | `item` |

Each member is a **`type: Template`** authoring tree:

- `Project.proj` — workspace member manifest (`project.template { shortName, identity }`)
- `.beskid/template.json` — authoritative engine manifest (`beskid.template.v1`)
- `content/` (or `workspace/`, `item/`) — scaffold sources copied on instantiation

Template roots are **not** runnable with `beskid build`; CI validates manifests and generated content policy, then (when wired) instantiates output and builds that tree.

## Authoring rules

- Use **`{{symbolId}}`** placeholders only (no alternate delimiter engines).
- Do **not** emit `noCorelib`, `useCorelib: false`, or other corelib opt-out keys in generated `Project.proj` files. Host projects resolve **corelib** implicitly on `beskid lock` / fetch.
- Avoid embedding foreign template engine schemas or .NET-style token syntax in sources.
- Keep `.beskid/template.json` out of generated output unless a source block intentionally copies it for documentation.

Normative contracts: [design model](https://beskid-lang.org/platform-spec/tooling/project-scaffolding/project-templates/design-model/) and [examples](https://beskid-lang.org/platform-spec/tooling/project-scaffolding/project-templates/examples/).

## Local development (CLI)

When the Beskid CLI implements project templates:

```bash
# List first-party templates from the registry
beskid new list

# Instantiate by short name
beskid new console -n MyGame -o ./MyGame

# Use this repository without publishing
beskid new --path ./packages/console -n Demo -o ./Demo
```

Registry install (after publish):

```bash
beskid new install beskid.templates.console
```

## CI

- **quality** — `python -m nox -s quality` validates `workspace.package.json`, every `.beskid/template.json`, and content policy (no corelib opt-out).
- **publish** — `ci/publish_templates.py` (skeleton) will pack and upload the workspace bundle to **pckg** when `BESKID_PCKG_API_KEY` is set, mirroring [corelib publish](../compiler/corelib/ci/publish_corelib.py).

Required secrets for publish on `main` / `v*` tags: `BESKID_PCKG_KEY` (mapped to `BESKID_PCKG_API_KEY` in the workflow).

## Workspace

`Workspace.proj` lists all template members. `workspace.package.json` (`beskid.workspace.package.v1`) describes registry metadata for future workspace-bundle publish.
