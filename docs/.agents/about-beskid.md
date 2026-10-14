# About Beskid

What Beskid is, why it exists, and how its pieces fit. Written by an agent
(Claude, 2026-10-14) from the repository at compiler 0.5.3, after reading
`README.md`, `GUIDE.md`, the glossary, `LICENSING.md`, the Book table of
contents and the change log. The last section is that agent's own view and is
marked as such.

## In one paragraph

Beskid is an ahead-of-time compiled programming language for everyday business
software: permissions, workflows, reports that have to match the finance
spreadsheet, and integrations with unreliable vendors. It is also everything
around the language: a Rust compiler with an LSP, a core library written in
Beskid, a package registry, editor extensions, a documentation site with a
book, a normative standard, a project tracker, a code-graph explorer and the
self-hosted infrastructure that runs them. The project is opinionated and
unfinished, and says both openly.

## The problem it answers

The README puts it in one line: "Most software is business records with
lipstick." In this kind of software the hard part is rarely the algorithm. It
is structure that hides in runtime behaviour: reflection, framework
conventions, dependency-injection containers, configuration nobody can trace.
Beskid tries to move that structure to where it can be seen and checked, which
is the compiler and the build output.

| What the industry offers | What Beskid aims for |
| --- | --- |
| Runtime mystery and reflection | Compile-time clarity that shows in the build artifact |
| Framework conventions | Language features as language features |
| Dependency-injection containers | Explicit wiring that the compiler checks |
| Enterprise process | Fast local development and honest CI |

The project also says what it is not for: finite-element solvers and game
engines belong to Rust or C++.

## The language at a glance

- **AOT only.** `beskid run` compiles and links a temporary native executable
  and runs it as a subprocess. There is no JIT and no interpreter
  (see `docs/glossary-wiki/keywords/AOT-run.md`).
- **Native targets.** ABI v5 supports exactly three 64-bit little-endian
  targets: `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin` and
  `x86_64-pc-windows-msvc`.
- **Source files** use `.bd`. Projects and workspaces use BSOL files (`.bproj`,
  `.bws`). The smallest program in the Book is:

  ```beskid
  unit Main() {
      // smoke
  }
  ```

- **Topics the language covers** (from the Book chapters): contracts and
  effects, memory without null-reference mistakes, fibers and channels, mods
  (compiler plugins), a core library with injection and resolution, a package
  system, public-API review, doc comments that are checked, and FFI with C and
  Rust ABI profiles.

## How the code becomes a program

1. The Pest grammar parses source into an AST.
2. Salsa computes generation-scoped semantic facts per AST node: resolution,
   types, signatures, control flow. These replace the older HIR and are the
   single semantic source for both the LSP and code generation.
3. The typed program becomes `CodegenInput`, which Cranelift ISLE rules lower
   to verifier-clean CLIF.
4. Cranelift emits native code, which is linked against a matching ABI v5
   runtime kit.

Details and rules are in [scopes/compiler.md](scopes/compiler.md).

## How the project is organised

The repository is a superrepo: one checkout that ties together the root and 11
git submodules, each a separate repository with its own history, tests and
release notes.

| Part | Where | Role |
| --- | --- | --- |
| Standard | `openspec/` | The only normative definition of the language and platform |
| Compiler | `compiler/` (submodule) | Rust CLI, compiler crates, LSP, runtime, corelib (nested submodule) |
| Registry | `pckg/` (submodule) | Package registry service and web UI at pckg.beskid-lang.org |
| Docs | `site/website/` | Landing page, Beskid Docs, the Book, the blog |
| Auth and Learn | `site/auth/`, `site/learn/` | Shared sign-in hub; interactive learning app |
| Tracker | `beskid_tracker/` (submodule) | SQLite roadmap and kanban; delivery authority |
| Nexus | `beskid_nexus/` (submodule) | Code and standard graph explorer, a GitNexus fork |
| Editors | `beskid_vscode/`, `editors/zed/`, `beskid_treesitter/` | Editor support and grammar |
| Shared web | `beskid_web_common/` (submodule) | `@beskid/*` TypeScript packages |
| Templates, BSOL, distribution | `beskid_templates/`, `beskid_bsol/`, `beskid_distrib/` | Scaffolds, project format, packaging |
| Infrastructure | `beskid_infra/`, `beskid_sites/deploy/`, `.woodpecker/` | Secrets, monitoring, production Compose, CI |

## How decisions are made

- **Standard first.** A change in observable behaviour starts as an OpenSpec
  change before any code. The Book and Docs are informative and link back to
  the standard; they never define rules themselves.
- **Delivery in the Tracker.** What ships in which version is decided in the
  Tracker's SQLite database, not in GitHub Issues.
- **One builder, one deployer.** Woodpecker validates and builds; stable
  releases go out only through a manual lane on `main`; Watchtower alone
  updates production.

## Who builds it

The upstream author and maintainer is Piotr Mikstacki (about 1,900 commits at
the time of writing), under the Cyber-Nomad-Collective organisation. Agents
from several vendors (Codex, Cursor, Claude) have worked in the repository
under his direction, which is why so much of its process is written down. See
[people/upstream-maintainer.md](people/upstream-maintainer.md).

## Licensing in brief

Apache-2.0 for the compiler, runtime, tooling, libraries and templates.
AGPL-3.0-only for Beskid-owned network services. CC-BY-4.0 for documentation
prose. Nexus remains PolyForm Noncommercial because of its GitNexus origin.
Programs compiled with Beskid can use any license. The exact path boundaries
are in `LICENSING.md`.

## Where to read further

- The Book: <https://beskid-lang.org/book/> (source in
  `site/website/src/content/docs/book/`)
- Beskid Docs: <https://beskid-lang.org/docs/>
- The Standard: <https://beskid-lang.org/docs/standard/> (source in
  `openspec/specs/`)
- Terms: the glossary wiki, `docs/glossary-wiki/` (one page per keyword)

## An outside view (the writing agent's opinion)

This section is opinion, not fact. It is the first impression of an agent
arriving with no history in the project.

- **The thesis is sound and rarely stated this plainly.** Most business code
  fails through hidden wiring, not through hard algorithms. A language that
  makes that wiring visible to the compiler is a real idea, not a rebrand.
- **The process discipline is unusual for a project this size.** A normative
  standard with a generated catalog, provenance hashes, spec-first changes,
  credential-scoped release lanes and a single deployment authority are what
  you normally see in much larger organisations. It is clearly built so that
  agents can work in it safely.
- **The surface area is the main risk.** One maintainer owns a language, a
  compiler, a runtime, a registry, two editors, a tracker, a graph explorer, a
  docs platform and the production infrastructure. The written process carries
  part of that load. It cannot carry all of it, and a newcomer feels the weight:
  the root `AGENTS.md` had grown into a list of rules from many sessions before
  this reorganisation.
- **The entry cost for outside contributors is high.** Private or relative
  submodule URLs, private `@beskid/*` packages and the toolchain spread make the
  first build harder than the README suggests. That is the area where a
  contributor from outside could help most.
- **The voice is part of the product.** The Book's chapter names ("Monorepo as
  coping mechanism", "Green tests, red production") show a project that knows
  its audience. Keep that voice in prose. It does not belong in normative text.
