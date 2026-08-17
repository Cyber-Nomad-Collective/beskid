import type { LandingSourceLink } from "./landing-sources";

export type LandingCodeLang = "beskid" | "csharp" | "il" | "asm";

export interface LandingCodeBlock {
	label: string;
	lang: LandingCodeLang;
	file: string;
	lines: string[];
}

export interface LandingTileLink extends LandingSourceLink {
	external?: boolean;
}

export interface LandingTile {
	id: string;
	title: string;
	teaser: string;
	specHref?: string;
	paragraphs: string[];
	links?: LandingTileLink[];
	codeBlocks?: LandingCodeBlock[];
}

export interface LandingTileSectionData {
	id: string;
	title: string;
	lead: string;
	tiles: LandingTile[];
}

const iocCompareTiles: LandingTile[] = [
	{
		id: "ioc-init",
		title: "App startup: registry vs ServiceCollection",
		teaser: "Declare hosts and launch—no BuildServiceProvider ceremony.",
		specHref: "/platform-spec/language-meta/composition/dependency-injection/",
		links: [
			{
				label: "Dependency injection in ASP.NET Core",
				href:
					"https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection",
				external: true,
			},
			{
				label: ".NET generic host",
				href:
					"https://learn.microsoft.com/en-us/dotnet/core/extensions/generic-host",
				external: true,
			},
		],
		paragraphs: [
			".NET centers on `Microsoft.Extensions.DependencyInjection`: `ServiceCollection` registration, `BuildServiceProvider()`, and `GetService` resolution at runtime—generic closure caches, scope checks, and optional feature flags in hosting assemblies.",
			"Beskid hosts are syntax: `registry { single SqlStorage for IStorage; }`, `startup(...)`, and `launch AppHost(args)`. `resolve_composition` merges the host inheritance chain, builds a `ServiceContainer`, and topologically sorts registrations before any machine code is emitted.",
			"Missing services, plural-inject ambiguity, and lifetime conflicts surface as `CompositionIssue` diagnostics during analysis—not exceptions thrown from a built container on first request.",
		],
		codeBlocks: [
			{
				label: "C# — Generic host + DI",
				lang: "csharp",
				file: "Program.cs",
				lines: [
					"var builder = Host.CreateApplicationBuilder(args);",
					"builder.Services.AddSingleton<IConfiguration, AppConfig>();",
					"builder.Services.AddSingleton<IStorage, SqlStorage>();",
					"builder.Services.AddSingleton<IStorage, FileStorage>();",
					"using var host = builder.Build();",
					"await host.RunAsync();",
				],
			},
			{
				label: "Beskid — host + launch",
				lang: "beskid",
				file: "app.bd",
				lines: [
					"host AppHost(string[] args) : ConsoleHost {",
					"    registry {",
					"        single AppConfig for IConfiguration;",
					"        single SqlStorage for IStorage;",
					"        single FileStorage for IStorage;",
					"    }",
					"    startup(IConfiguration config, IStorage[] storages) {",
					"        for s in storages { s.Open(config); }",
					"    }",
					"}",
					"unit main() { launch AppHost(args); }",
				],
			},
		],
	},
	{
		id: "mods-vs-generators",
		title: "Compiler Mods vs IIncrementalGenerator",
		teaser: "Typed emit at compile time—not partial source text surgery.",
		specHref: "/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/",
		links: [
			{
				label: "Source generators (C#)",
				href:
					"https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/source-generators-overview",
				external: true,
			},
			{
				label: "System.Text.Json generator perf (dotnet/runtime#68353)",
				href: "https://github.com/dotnet/runtime/issues/68353",
				external: true,
			},
		],
		paragraphs: [
			"C# `IIncrementalGenerator` runs inside Roslyn, observes syntax via `IncrementalGeneratorInitializationContext`, and emits text with `AddSource`—downstream compilations must re-parse the generated `.g.cs` files and fight cache invalidation across IDE keystrokes.",
			"Beskid Compiler Mods compile as their own AOT Mod targets. Generators implement SDK contracts and return structured syntax edits through `SdkSyntaxPipeline`, validated against the current `SyntaxSnapshot` generation.",
			"The host re-parses merged syntax under `syntax_generation` phase boundaries instead of treating generated text as an opaque `#line` patch—semantic analysis always sees a single checked program before `lower`.",
		],
		codeBlocks: [
			{
				label: "C# — incremental generator sketch",
				lang: "csharp",
				file: "RepoGenerator.cs",
				lines: [
					"[Generator(LanguageNames.CSharp)]",
					"public sealed class RepoGenerator : IIncrementalGenerator {",
					"    public void Initialize(IncrementalGeneratorInitializationContext ctx) {",
					"        ctx.RegisterSourceOutput(",
					"            ctx.SyntaxProvider.CreateSyntaxProvider(...),",
					'            static (sp, ct) => sp.AddSource("Repo.g.cs", "// emitted text"));',
					"    }",
					"}",
				],
			},
			{
				label: "Beskid — Mod generator contract",
				lang: "beskid",
				file: "mods/RepoGen.bd",
				lines: [
					"// Mod package (project.type = Mod) — AOT build + mod.descriptor.json",
					"use Beskid.Compiler.Collect;",
					"",
					"pub type RepoGen : Beskid.Compiler.Collect.Generator {}",
					"",
					"GeneratedSyntaxContribution Generate(GenerationRequest request) {",
					'    // Query + typed emit; host merges items — no AddSource("*.g.cs")',
					"    return GeneratedSyntaxContribution {};",
					"}",
					"",
					"// contribution item (module level), e.g. from Generator:",
					"extend type Order {",
					"    pub unit EnsureRepository() { }",
					"}",
				],
			},
		],
	},
	{
		id: "il-verbosity",
		title: "What lands in the binary",
		teaser: "IL ceremony vs compile-time tables and native lowering.",
		specHref: "/platform-spec/compiler/build-pipeline/backends-jit-aot/",
		links: [
			{
				label: "Managed execution process (CLR)",
				href:
					"https://learn.microsoft.com/en-us/dotnet/standard/managed-execution-process",
				external: true,
			},
			{
				label: "Common Intermediate Language",
				href: "https://learn.microsoft.com/en-us/dotnet/standard/managed-code#cil",
				external: true,
			},
		],
		paragraphs: [
			"A minimal .NET generic host still expands into IL with `IServiceProvider` locals, virtual calls through hosting extension methods, and—when async is involved—nested state-machine types even for straight-line startup code.",
			"Beskid launch lowering emits ordinary functions and static data: composition produces a `BindingPlan` consumed by codegen, field `inject` sites become direct loads/calls, and heap pointers go through `alloc` plus `gc_write_barrier` when stores can hide objects during marking.",
			"The same `beskid_codegen` → Cranelift path compiles app logic and runtime builtins; there is no second VM-specific instruction set to optimize away later. Excerpts below are illustrative; real binaries depend on inlining and debug profile.",
		],
		codeBlocks: [
			{
				label: "IL — illustrative DI + host path (excerpt)",
				lang: "il",
				file: "Program.il",
				lines: [
					".method public hidebysig instance void Run() cil managed",
					"{",
					"  .locals init (",
					"    [0] class IServiceProvider provider,",
					"    [1] class IConfiguration config,",
					"    [2] class IStorage[] storages)",
					"  IL_0000: call class ServiceCollection class Program::CreateServices()",
					"  IL_0005: callvirt instance class IServiceProvider ...::BuildServiceProvider()",
					"  IL_000a: callvirt instance object IServiceProvider::GetService(class IConfiguration)",
					"  // ... many more calls for scopes, arrays, IDisposable checks",
					"}",
				],
			},
			{
				label: "Native — illustrative Beskid lowering (comments)",
				lang: "asm",
				file: "app.s (conceptual)",
				lines: [
					"; launch AppHost — no ServiceProvider type",
					"app_host_init:",
					"    lea     rdi, [rel registry_vtable_sql]",
					"    call    SqlStorage_open",
					"    mov     [rel aggregator_storages], rax",
					"; field inject offsets known at compile time",
					"Aggregator_Process:",
					"    mov     rax, [rbx + 24]    ; inject IConfiguration",
				],
			},
		],
	},
	{
		id: "aot-native-wins",
		title: "Why AOT + language features beat corelib composition",
		teaser: "Fewer runtime layers means fewer surprise costs.",
		specHref: "/platform-spec/compiler/pipeline-composition/",
		links: [
			{
				label: "Native AOT deployment overview",
				href: "https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/",
				external: true,
			},
			{
				label: "Creating AOT-compatible libraries",
				href:
					"https://devblogs.microsoft.com/dotnet/creating-aot-compatible-libraries/",
				external: true,
			},
		],
		paragraphs: [
			"When DI, hosting, configuration, and codegen all live in NuGet policy assemblies, every feature pays virtual dispatch, generic sharing tables, and trim/AOT analyzer fallbacks when closed types are not visible at publish time.",
			"Beskid folds policy into compiler phases: `composition.resolve` before `lower`, `mod.*` before HIR merge, builtins declared once and imported by both JIT and AOT backends.",
			"Corelib packages wrap syscall/runtime builtins—they do not replace language semantics. You keep .NET's lesson on developer experience; you drop discovering platform rules via reflection at runtime.",
		],
	},
];

/** Compile-time composition, runtime, and concurrency vs C# / .NET */
export const alreadyBetterSection: LandingTileSectionData = {
	id: "already-better",
	title: "Already better than C#",
	lead:
		"Not everywhere—C# still wins on ecosystem size and library mass today. But where Beskid already ships code (not slideware), the differences are concrete: the compiler lowers to Cranelift object files, resolves host/DI graphs before launch, runs Mods through generation-checked syntax pipelines, schedules cooperative fibers over a syscall pool, and collects heap objects with a Go-style concurrent mark-and-sweep GC in the `abfall` runtime.",
	tiles: [
		...iocCompareTiles,
		{
			id: "aot-first",
			title: "AOT as the default build path",
			teaser: "Object emission and link—not a trim pass on IL.",
			specHref: "/platform-spec/compiler/build-pipeline/backends-jit-aot/",
			links: [
				{
					label: "ASP.NET Core Native AOT",
					href:
						"https://learn.microsoft.com/en-us/aspnet/core/fundamentals/native-aot",
					external: true,
				},
				{
					label: "Introduction to AOT warnings",
					href:
						"https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/fixing-warnings",
					external: true,
				},
			],
			paragraphs: [
				"Native AOT for .NET is a publish profile layered onto a reflection-first BCL: trim analyzers, feature switches, and component support matrices gate what can ship.",
				"`beskid build` walks the same pipeline ids as the spec (`lower` → `codegen_clif` → `aot.emit_object` → `aot.link`). `BeskidObjectModule` lowers each `CodegenArtifact` function through Cranelift into a PIC object file, then links the prebuilt runtime—no intermediate language in the hot path.",
				"JIT (`beskid_engine`) reuses the same CLIF lowering for dev runs; AOT is not a separate language mode, just the normal artifact path with a platform linker at the end.",
			],
			codeBlocks: [
				{
					label: "C# — publish profile mental model",
					lang: "csharp",
					file: "publish",
					lines: [
						"// dotnet publish -r linux-x64 -p:PublishAot=true",
						"// + trim warnings, reflection analyzer, feature switches",
						"// + library support matrix per component",
					],
				},
				{
					label: "Beskid — build target",
					lang: "beskid",
					file: "Project.proj",
					lines: [
						"// App target — AOT backend in build pipeline",
						"target app App {",
						"    backend Aot",
						"}",
					],
				},
			],
		},
		{
			id: "parallel-gc",
			title: "Concurrent mark-and-sweep GC (shipped)",
			teaser: "Go-style tri-color collector—not a future roadmap item.",
			specHref: "/platform-spec/execution/runtime/memory-and-gc-runtime-contract/",
			links: [
				{
					label: "Fundamentals of garbage collection (.NET)",
					href:
						"https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals",
					external: true,
				},
				{
					label: "Go GC guide (design reference)",
					href: "https://go.dev/doc/gc-guide",
					external: true,
				},
			],
			paragraphs: [
				".NET's GC is mature, but it sits behind JIT tiers, write barriers tuned for generational assumptions, and a large managed object header story—fine for long-lived services, heavy for tight CLIs and fiber-heavy workloads.",
				"Beskid ships `abfall`: a concurrent tri-color mark-and-sweep heap with Idle → Marking → Sweeping phases, a background collector thread that marks in bounded work budgets, Dijkstra insertion barriers during marking, and brief STW only for root scanning—same architectural family as Go's collector.",
				"Codegen emits `TypeDescriptor` pointer layouts and calls `gc_write_barrier` on pointer stores. Fibers allocate through `Heap::allocate_beskid`; GC tests cover fiber allocations, channel waits under collection, and concurrent mutation (`gc_concurrency.rs`, `abfall/tests/gc_functional.rs`).",
				"The runtime shares one `Arc<Heap>` across mutator threads; pacing is configurable via `GcOptions` incremental budgets, so throughput targets Go-like “collector runs beside mutators” behavior rather than stop-the-world-only heaps.",
			],
		},
		{
			id: "fibers",
			title: "Fibers instead of async state machines",
			teaser: "Like Go/Ruby ergonomics—without their runtime tradeoffs here.",
			specHref: "/platform-spec/language-meta/evaluation/fibers-and-spawn/",
			links: [
				{
					label: "Go: Goroutines",
					href: "https://go.dev/doc/effective_go#goroutines",
					external: true,
				},
				{
					label: "C# async/await",
					href:
						"https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/",
					external: true,
				},
			],
			paragraphs: [
				"C# `async/await` lowers to `IAsyncStateMachine` types with `MoveNext` state machines and `Task` allocations; every await is a compiler transform, not a lightweight stack switch.",
				"Beskid `spawn` is analyzed in `beskid_analysis` and lowered to `fiber_spawn` / `fiber_spawn_with_cancel_slot` builtins. The scheduler is cooperative M:N: `corosensei` stacks, a run queue, and `processor_count()` aligned to available parallelism.",
				"Blocking work uses `syscall_pool`: the current fiber parks, a worker thread runs the syscall/body, then `wake_fiber` resumes the coroutine—same “write blocking code” ergonomics as Go, without adopting Go's whole runtime or its GC tradeoffs.",
				"Channels, mutex, wait-group, and cancel propagate through split ABI status/value builtins (M1–M6 in `CONCURRENCY_STATUS.md`); there is no `async` keyword or state-machine codegen path in the compiler.",
			],
			codeBlocks: [
				{
					label: "C# — async expands to state machine",
					lang: "csharp",
					file: "Worker.cs",
					lines: [
						"public async Task RunAsync() {",
						"    await DoWorkAsync();",
						"    // compiler generates IAsyncStateMachine + MoveNext",
						"}",
					],
				},
				{
					label: "Beskid — spawn + channel",
					lang: "beskid",
					file: "worker.bd",
					lines: [
						"unit Run() {",
						"    Fiber<void> f = spawn { Process(); };",
						"    Channel<int> ch = Channel<int>.Create(64);",
						"    f.Join();",
						"}",
					],
				},
			],
		},
		{
			id: "async-await-pain",
			title: "async/await foot-guns",
			teaser: "ConfigureAwait, sync-over-async, and exception paths.",
			specHref: "/platform-spec/execution/runtime/fiber-scheduler-and-stacks/",
			links: [
				{
					label: "ConfigureAwait FAQ",
					href: "https://devblogs.microsoft.com/dotnet/configureawait-faq/",
					external: true,
				},
				{
					label: "Async/Await best practices",
					href:
						"https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming",
					external: true,
				},
			],
			paragraphs: [
				"async/await is ergonomic until it isn't: forgotten ConfigureAwait in libraries, sync-over-async deadlocks on UI threads, exception stacks split across awaits, and analyzer churn on ValueTask vs Task.",
				"The Beskid compiler has no async/await lowering pass—suspension is explicit via fiber yield, channel receive, and syscall parking. Failures return through `Result` and channel status codes, not task exception aggregation.",
				"That removes an entire class of IL and debugging surface area: no state-machine types in metadata, no continuation marshaling back to a captured `SynchronizationContext`, and no “blocked thread pool thread” failure mode from `.Result` on a UI handler.",
			],
			codeBlocks: [
				{
					label: "C# — classic deadlock shape",
					lang: "csharp",
					file: "UiThread.cs",
					lines: [
						"button.Click += async (_, _) => {",
						"    var data = GetDataAsync().Result; // sync-over-async",
						"};",
					],
				},
			],
		},
		{
			id: "compile-time-di",
			title: "Compile-time DI graph",
			teaser: "Errors before launch, not at first GetService.",
			specHref:
				"/platform-spec/language-meta/composition/dependency-injection/design-model/",
			links: [
				{
					label: "Dependency injection guidelines",
					href:
						"https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines",
					external: true,
				},
			],
			paragraphs: [
				"C# DI failures often surface at runtime: missing registration, captive dependencies, wrong lifetime—discovered in staging or production via `GetService` / `GetRequiredService`.",
				"`resolve_composition` runs in the `composition.resolve` pipeline phase: it builds the launch host chain, merges registries and scopes, validates scope trees, resolves `inject` fields into a dependency graph, and emits `CompositionIssue` diagnostics (duplicate launch hosts, lifetime conflicts, unresolved inject) before codegen.",
				"Successful resolution produces a `BindingPlan` and `CompositionSnapshot` with topo-ordered registration init—lowering wires real calls, not a runtime `IServiceProvider` dictionary lookup in the hot path.",
			],
			codeBlocks: [
				{
					label: "Beskid — override lifetime check",
					lang: "beskid",
					file: "hosts.bd",
					lines: [
						"host Child : Parent {",
						"    registry {",
						"        transient Logger for ILogger; // error if parent had single",
						"    }",
						"}",
					],
				},
			],
		},
		{
			id: "mods-scheduling",
			title: "Deterministic mod scheduling",
			teaser: "Replay boundaries Roslyn generators struggle to document.",
			specHref:
				"/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/",
			links: [
				{
					label: "Incremental source generators",
					href:
						"https://github.com/dotnet/roslyn/blob/main/docs/features/incremental-generators.md",
					external: true,
				},
				{
					label: "Incremental generators short-circuit (roslyn#55579)",
					href: "https://github.com/dotnet/roslyn/issues/55579",
					external: true,
				},
			],
			paragraphs: [
				"Roslyn incremental generators keep per-author state inside the compiler service; reproducibility and invalidation semantics vary by generator and often regress IDE latency (see runtime issues on JSON/logger generators).",
				"Beskid Mods are separate AOT Mod projects executed in `mod.load` → `mod.generate` host phases. The Mod SDK `Query` bridge tags every `NodeRef` with `syntax_generation_id`; `SdkSyntaxPipeline` rejects stale ops when the snapshot generation does not match—fail closed instead of silently patching old syntax.",
				"Pipeline phase ids give hosts a single observable schedule for workspace resolve, mod collect/generate, semantic snapshot, composition, lower, and AOT emit—deterministic boundaries the C# generator ecosystem does not standardize.",
			],
		},
	],
};
