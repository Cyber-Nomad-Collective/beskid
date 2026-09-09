import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



The model separates planning from materialization:

- `CompilePlan` describes target graph and dependency intent.
- `PreparedProjectWorkspace` records concrete source roots under `obj/beskid/deps/src`; these paths are **authoritative** for **[Program assembly](/platform-spec/compiler/build-pipeline/program-assembly/)** when present.
- `WorkspacePrepareOptions` carries lock policy (`frozen`, `locked`).
- `Project.lock` is the persisted snapshot used for repeatable resolution.
