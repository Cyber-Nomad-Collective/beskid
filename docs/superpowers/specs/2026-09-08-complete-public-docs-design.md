# Complete public Docs design

## Goal

Make `https://beskid-lang.org/docs/` the complete technical guidance surface
for Beskid. A reader must be able to evaluate, install, use, extend, publish,
operate, and contribute to Beskid without depending on stale Book prose or an
implementation checkout.

The Docs prose follows ASD-STE100, Issue 9, January 2025. Code, commands,
identifiers, requirement keywords, and scenario keywords keep their exact
syntax. The use of ASD-STE100 is an authoring and review policy. It is not a
claim of third-party certification.

## Evidence baseline

The design uses the repository state from 2026-09-08.

| Fact | Evidence | Design consequence |
| --- | --- | --- |
| Public Docs contains 10 pages. The Book contains 184 pages. | `site/website/src/content/docs/docs/` and `site/website/src/content/docs/book/` | Move current task guidance into Docs. Keep the Book as narrative learning material. |
| Eight Docs pages render two H1 headings. | Frontmatter titles plus authored H1 headings in the Docs source | Let Starlight render the only H1. Add a built-output test. |
| Docs has no Mermaid diagram and no authored Starlight Aside. | Docs source inventory | Add diagrams only when a sequence, choice, or relationship needs them. Add accessible text equivalents. |
| The current link test does not inspect routes or anchors. | `site/website/package.json` and `remark-beskid-directives.test.mjs` | Add a built-output route and anchor verifier. |
| Current guidance contains removed commands, `.proj` names, JIT execution claims, and ABI-v4 claims. | CLI, project, package, language, and architecture audits | Treat current operational facts as a contract. Remove or explicitly mark historical material. |
| The compiler checkout contains an unrelated unresolved merge. | `git -C compiler status` | Never edit it. Read the root-pinned compiler object or a clean revision supplied by its owner. |
| Download platform identifiers differ between the API and shared UI. | `api/version.json.ts` and `DownloadsSection.tsx` | Define one platform identifier contract and test all supported tabs. |
| The visible Docs navigation is duplicated. | `astro.config.mjs` and `DocsNavChrome.astro` | Define navigation once and consume it in both renderers. |
| Legacy Standard links collapse to the generic landing page. | `remark-beskid-directives.mjs` and the OpenSpec catalog | Preserve a stable capability or requirement identity in the public destination. |

Detailed supporting audits live outside the repository:

- `~/.agents/knowledge/beskid-docs-user-journeys.md`
- `~/.agents/knowledge/beskid-docs-cli-packages.md`
- `~/.agents/knowledge/beskid-docs-language-architecture.md`

These files are evidence only. They must not be committed or pushed.

## Authority model

Each kind of information has one authority.

| Information | Authority | Public presentation |
| --- | --- | --- |
| Required Beskid behavior | `openspec/specs/**/spec.md` | Standard pages and precise links from Docs |
| Current technical procedure | `/docs/` source | Short task page with verified commands and outcomes |
| Command syntax | Clean CLI help snapshot or root-pinned Clap model | Generated or contract-tested Docs reference |
| Learning sequence and rationale | The Beskid Book | Narrative page that links to the current Docs task |
| Dated project news | Blog | Dated and non-authoritative article |
| Delivery status | Tracker and release metadata | Status callout or generated release view |
| Service operation | Service and infrastructure contracts | Public operator guide with source links |

Docs must not reproduce a normative requirement as a new rule. A Docs page
can summarize the effect of a rule and must link to the authoritative
capability. A Book page can explain a topic and must link to the current Docs
procedure instead of repeating mutable command flags.

## Audience model and information architecture

The Docs navigation has six task-oriented areas.

1. **Start** covers evaluation, release status, installation, the first
   executable program, editor setup, and first-day troubleshooting.
2. **Develop** covers language basics, projects, workspaces, dependencies,
   locks, build, run, test, diagnostics, and the command line.
3. **Publish** covers package identity, credentials, pack, upload, consume,
   documentation, version selection, yank, and recovery.
4. **Operate** covers containers, services, authentication, health checks,
   delivery, secrets, monitoring, and rollback boundaries.
5. **Contribute** covers repository setup, submodule ownership, tests,
   OpenSpec changes, Docs authoring, and release evidence.
6. **Reference** covers current commands, configuration files, environment
   variables, file types, architecture, licensing, and the Standard.

The Docs home starts with an audience-to-task map. Internal release
coordination does not appear before the first user task. Release maturity is a
compact callout that links to the delivery authority.

## Page contract

Every technical Docs page uses typed frontmatter:

```yaml
audience:
  - newcomer
authority:
  status: informative
  sourceLabel: Beskid CLI reference
  sourceHref: /docs/reference/cli/
  limits: This page gives a verified workflow. It does not define language behavior.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
```

The permitted status values are `normative`, `informative`, `generated`,
`preview`, `deprecated`, and `security-sensitive`. All fields are required for
technical Docs pages. A shared renderer places an accessible annotation after
the page title. Authors do not write a repeated `## Document annotation`
section.

Each task page contains these sections when they apply:

- prerequisites;
- what the procedure changes;
- numbered actions with one action per step;
- expected result;
- failure and recovery path;
- next task;
- exact authority and verification annotation.

Security-sensitive pages explain secret handling before the first credential
command. Examples use environment variables or supported secret storage. They
do not put literal tokens on a command line or in a committed file.

## Diagram contract

Use Mermaid for relationships that are materially clearer as a diagram. The
initial set is:

- audience to task;
- installation choice and verification;
- source to AOT executable;
- CLI task taxonomy;
- workspace, project, lock, and materialized dependency graph;
- package publication and consumption sequence;
- editor and language-server sequence;
- reproducible CI sequence;
- service and authentication topology;
- OpenSpec authority and publication flow;
- troubleshooting decision tree.

Each diagram has a short introduction and a text or table equivalent. Diagram
labels use the same terms as the prose. Links use current public routes.
Diagrams render in light and dark themes.

## Alignment policy

The root-pinned compiler commit is the read-only implementation baseline until
the compiler-owning task supplies a newer clean revision. No task in this work
may edit, stage, resolve, commit, merge, or push a compiler file or compiler
gitlink.

The current public command spelling is the concise root command. The grouped
`beskid dev` spelling is documented once as an advanced alias. Active examples
use `.bproj` and `.bws`. Historical names appear only in a deprecated migration
callout. User-facing execution is AOT. JIT is mentioned only for an explicitly
verified internal REPL implementation detail.

Conflicts between OpenSpec and implementation are not silently resolved in
informative prose. The page states that the area is under reconciliation and
links to the conflicting authorities. A normative correction requires a valid
OpenSpec change with requirements and scenarios.

## Validation

The website gate must prove these properties:

1. Every Docs route has exactly one H1.
2. Every internal route and anchor resolves in built output.
3. Every technical Docs page has complete typed annotation metadata.
4. The visible navigation has one source and covers every Docs route.
5. Rejected manifest names and removed commands do not occur in active
   technical guidance.
6. Current execution guidance does not call `beskid run` a JIT command.
7. Mermaid blocks compile and every diagram has an adjacent text equivalent.
8. Download platform identifiers match the UI selection contract.
9. Stable and unstable releases have explicit labels and pinning guidance.
10. An STE review tool reports sentence-length, passive-voice, terminology,
    abbreviation, and article candidates. Human review decides exceptions.

The final verification includes focused tests, the full website test suite, a
production build, a built-output audit, and in-app browser inspection of each
top-level Docs area. Completion is not established until the public deployment
matches the built result.
