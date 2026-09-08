# Public Docs user-journey expansion design

## Goal

Extend the public Docs from a strong installation and operator baseline into a
complete task surface for people who evaluate, learn, use, extend, and maintain
Beskid. Keep product-use instructions separate from service-operation
instructions.

This design continues the approved
`2026-09-08-complete-public-docs-design.md`. Its page annotation, authority,
ASD-STE100, diagram, accessibility, and verification contracts remain binding.

## Evidence baseline

The baseline is root commit `3143396b796d86c1a70a0bfb1aa4761b593bbae5`.
Compiler content is outside this design.

| Fact | Evidence | Consequence |
| --- | --- | --- |
| All 36 current technical Docs pages have typed annotations. | `docs-contract.test.mjs` and a source inventory | Preserve the contract for every new page. |
| The 33 current task pages have prerequisites, actions, expected result, recovery, and next task sections. | `docs-procedures.test.mjs` | Define page kinds so structural exceptions are explicit. |
| All 11 current Mermaid diagrams have adjacent text equivalents. | `docs-procedures.test.mjs` | Add diagrams only for branching or multi-party flows. |
| Learn, Tracker, and Nexus Docs focus on service operation. | `docs/services/{learn,tracker,nexus}.md` | Add separate product-use journeys and cross-link the operator contracts. |
| The VS Code page stops after LSP diagnostics. | `docs/getting-started/editor.md` and pinned `beskid_vscode` | Add the project, status, package, and graph workflow. |
| Template, Tree-sitter, BSOL, shared-web-package, and Learn-curriculum workflows have no public task route. | Pinned submodule READMEs and root sources | Add focused contributor and integration pages. |
| Three annotations link to mutable `main` sources. | STE and annotation audit | Pin links to the revision already declared in frontmatter. |
| Deployment and authentication authorities conflict. | Tracked root workflow, pinned infra sources, and dirty untracked integration state | Keep the existing stop condition. Do not invent an operator runbook. |

Detailed audits live outside the repository in:

- `~/.agents/knowledge/beskid-docs-audience-gap-audit.md`;
- `~/.agents/knowledge/beskid-docs-ste-annotation-audit.md`;
- `~/.agents/knowledge/beskid-docs-services-usage-audit.md`.

## Information architecture

Add three task-oriented groups without moving the existing operator pages:

1. **Evaluate and Learn** contains a readiness decision and the interactive
   lesson journey.
2. **Use the Platform** contains account, Tracker, and Nexus reader tasks.
3. **Extend** contains advanced VS Code use, BSOL, template authoring,
   Tree-sitter integration, and shared web packages.

Keep **Operate** for health, state, containers, and deployment boundaries.
Keep **Contribute** for repository ownership and change procedures.

## Coverage contract

Create one checked-in coverage catalogue for non-compiler public surfaces. Each
entry defines a stable key, audience, source boundary, public Docs route, page
kind, and diagram policy. Tests require:

- one existing Docs route for each catalogue entry;
- one navigation leaf for each route;
- complete annotation metadata;
- the correct structure for its page kind;
- a Mermaid diagram and adjacent text equivalent when the policy is
  `required`;
- an explicit reason when the policy is `not-needed`;
- no mutable GitHub branch URL when the page declares an immutable revision.

The catalogue is a completeness assertion, not a normative authority. It links
to implementation sources and can grow when a new public surface ships.

## Page kinds

Use three explicit page kinds in frontmatter:

- `task`: the five-section executable procedure is required;
- `guide`: a structured explanation that must contain an orientation section,
  a decision or use section, limits, and next steps;
- `reference`: stable lookup material that must state scope, authority, and how
  to report a mismatch.

Existing task pages remain `task`. The Standard index is `reference`. The Docs
and STE authoring pages are `guide` unless they are rewritten as executable
tasks.

## Content rules

- Use pinned root or submodule evidence. Do not read or modify `compiler/`.
- State user roles and permission boundaries before authenticated actions.
- Explain observable outcomes and stop conditions.
- Keep secrets in environment variables or the documented secret manager.
- Do not copy normative rules from OpenSpec.
- Use current pnpm commands for root workspace packages. Preserve Bun only for
  a component whose package metadata and CI require it.
- Link from product-use pages to operator contracts, but do not mix deployment
  actions into ordinary user tasks.
- Do not describe the disputed Platform Spec, release-promotion, or service-auth
  topology as settled.

## Diagram set

Add accessible Mermaid diagrams, each followed by a `### Diagram text`
equivalent, for:

- evaluation decision and stop criteria;
- learner lesson-check feedback loop;
- Tracker delivery, bug, and Standard authority boundaries;
- Nexus reader, administrator, and MCP role boundaries;
- VS Code extension, project context, CLI, LSP, package, and graph flow;
- superrepo setup profile and ownership selection.

Use tables for linear template, BSOL, Tree-sitter, curriculum, and shared-package
procedures.

## Verification

The increment is acceptable when focused coverage tests, the full website test
suite, the STE reviewer, OpenSpec validation, the production build, and the
built-output verifier pass. Browser inspection must cover one new page from
each group and both visual themes after deployment.

The larger active goal remains open while tracked sources still disagree about
deployment ownership, service inventory, or authentication topology.
