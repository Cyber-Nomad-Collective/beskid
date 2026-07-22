import type {
	ArchitectureEdge,
	ArchitectureEdgeKind,
	ArchitectureManifest,
} from "#/lib/architecture/architecture-model";

export const BuildTraversal = [
	"beskid-source",
	"workspace-resolver",
	"expanded-syntax-assembly",
	"generation-safe-facts",
	"typed-program",
	"codegen-input",
	"isle-operation-selection",
	"stock-clif",
	"clif-verifier",
	"codegen-artifact",
	"aot-backend",
	"runtime-kit",
	"native-artifact",
] as const;

const IdeTraversal = [
	"tree-sitter",
	"vs-code",
	"lsp",
	"generation-safe-facts",
	"diagnostics",
] as const;

const SpecToCodeTraversal = [
	"openspec",
	"openspec-catalog",
	"conformance-evidence",
	"codegen-input",
	"isle-operation-selection",
	"stock-clif",
	"clif-verifier",
	"codegen-artifact",
] as const;

function edge(
	id: string,
	from: string,
	to: string,
	kind: ArchitectureEdgeKind,
	label: string,
	description: string,
): ArchitectureEdge {
	return { id, from, to, kind, label, description, state: "current" };
}

export const CompilerArchitectureManifest: ArchitectureManifest = {
	groups: [
		{ id: "authority", label: "Authority and evidence", description: "Normative specification and conformance evidence." },
		{ id: "projects", label: "Projects and packages", description: "Workspace, package, and core library boundaries." },
		{ id: "frontend", label: "Frontend and semantics", description: "Syntax, semantic facts, and diagnostics." },
		{ id: "codegen", label: "Codegen and execution", description: "AOT lowering, verification, ABI, and runtime kits." },
		{ id: "tooling", label: "Developer tooling", description: "Editing and command-line integration boundaries." },
	],
	nodes: [
		{ id: "openspec", label: "OpenSpec", description: "Normative authority for public compiler requirements.", group: "authority", kind: "authority", state: "current", specKeys: ["standard-content-authority"], sourcePaths: ["openspec/specs"] },
		{ id: "openspec-catalog", label: "OpenSpec catalog", description: "Generated public specification index.", group: "authority", kind: "evidence", state: "derived", specKeys: [], sourcePaths: ["openspec/catalog.json"] },
		{ id: "conformance-evidence", label: "Conformance evidence", description: "Tests and records that demonstrate conformance.", group: "authority", kind: "evidence", state: "current", specKeys: ["compiler--conformance--conformance-evidence-policy"], sourcePaths: ["compiler"] },
		{ id: "beskid-source", label: "Beskid source", description: "Beskid program source supplied to an AOT build.", group: "projects", kind: "source", state: "current", specKeys: [], sourcePaths: ["compiler"] },
		{ id: "bsol-manifest", label: "BSOL manifest", description: "Project manifest for a Beskid workspace.", group: "projects", kind: "manifest", state: "current", specKeys: ["compiler--resolution-and-projects--project-manifest-contract"], sourcePaths: ["compiler"] },
		{ id: "workspace-resolver", label: "Workspace resolver", description: "Resolves workspace inputs, dependencies, and lock state.", group: "projects", kind: "process", state: "current", specKeys: ["compiler--resolution-and-projects--workspace-resolution-contract"], sourcePaths: ["compiler/crates"] },
		{ id: "pckg", label: "pckg", description: "Package registry boundary used by dependency resolution.", group: "projects", kind: "package", state: "current", specKeys: ["compiler--resolution-and-projects--registry-and-overrides-contract"], sourcePaths: ["pckg"] },
		{ id: "corelib", label: "Corelib", description: "Beskid core library resolved into compilation.", group: "projects", kind: "package", state: "current", specKeys: ["core-library--compiler-integration--corelib-injection-and-resolution"], sourcePaths: ["compiler/corelib"] },
		{ id: "compiler-mods", label: "Compiler Mods", description: "Compiler extension and composition boundary.", group: "projects", kind: "package", state: "current", specKeys: ["compiler--compiler-mods--mod-host-bridge"], sourcePaths: ["compiler/crates"] },
		{ id: "parser", label: "Parser", description: "Parses source into immutable syntax.", group: "frontend", kind: "process", state: "current", specKeys: ["compiler--front-end--grammar-and-parser-contract"], sourcePaths: ["compiler/crates"] },
		{ id: "expanded-syntax-assembly", label: "Expanded syntax assembly", description: "Immutable syntax assembly after expansion.", group: "frontend", kind: "representation", state: "current", specKeys: ["compiler--build-pipeline--program-assembly"], sourcePaths: ["compiler/crates"] },
		{ id: "generation-safe-facts", label: "Generation-safe Salsa facts", description: "Generation-bound semantic facts used by IDE and compiler flows.", group: "frontend", kind: "representation", state: "current", specKeys: ["compiler--semantic-pipeline--stage-ordering"], sourcePaths: ["compiler/crates/beskid_queries"] },
		{ id: "diagnostics", label: "Diagnostics", description: "Diagnostics derived from parser and semantic facts.", group: "frontend", kind: "process", state: "current", specKeys: ["compiler--semantic-pipeline--rules-and-diagnostics-catalog"], sourcePaths: ["compiler/crates"] },
		{ id: "typed-program", label: "TypedProgram", description: "Typed semantic program on the production lowering path.", group: "frontend", kind: "representation", state: "current", specKeys: ["compiler--semantic-pipeline--type-system-pass-contract"], sourcePaths: ["compiler/crates"] },
		{ id: "typed-hir-compatibility", label: "Typed-HIR compatibility", description: "Visible legacy preparation path, excluded from production lowering.", group: "frontend", kind: "representation", state: "transitional", specKeys: ["compiler--front-end--hir-normalization-and-legality"], sourcePaths: ["compiler/crates"] },
		{ id: "codegen-input", label: "CodegenInput", description: "Lowering contract from TypedProgram to operation selection.", group: "codegen", kind: "representation", state: "current", specKeys: ["compiler--codegen-and-ir--lowering-contract"], sourcePaths: ["compiler/crates"] },
		{ id: "isle-operation-selection", label: "ISLE operation selection", description: "Generated ISLE lowering into stock CLIF.", group: "codegen", kind: "process", state: "current", specKeys: ["compiler--codegen-and-ir--lowering-contract"], sourcePaths: ["compiler/crates"] },
		{ id: "stock-clif", label: "Stock CLIF", description: "Stock Cranelift IR emitted by ISLE lowering.", group: "codegen", kind: "representation", state: "current", specKeys: ["compiler--codegen-and-ir--codegen-artifact-schema"], sourcePaths: ["compiler/crates"] },
		{ id: "clif-verifier", label: "CLIF verifier", description: "Verifier for the stock CLIF lowering result.", group: "codegen", kind: "process", state: "current", specKeys: ["compiler--build-pipeline--stage-ordering"], sourcePaths: ["compiler/crates"] },
		{ id: "codegen-artifact", label: "CodegenArtifact", description: "Verified artifact passed to the AOT backend.", group: "codegen", kind: "artifact", state: "current", specKeys: ["compiler--codegen-and-ir--codegen-artifact-schema"], sourcePaths: ["compiler/crates"] },
		{ id: "aot-backend", label: "AOT backend", description: "Production ahead-of-time backend.", group: "codegen", kind: "process", state: "current", specKeys: ["compiler--build-pipeline--backends-jit-aot"], sourcePaths: ["compiler/crates"] },
		{ id: "abi-manifest", label: "ABI manifest", description: "Versioned ABI contract for runtime-kit integration.", group: "codegen", kind: "manifest", state: "current", specKeys: ["execution--abi-and-host--abi-versioning-and-compatibility"], sourcePaths: ["compiler"] },
		{ id: "generated-abi", label: "Generated ABI", description: "Generated ABI bindings consumed by artifacts and runtime kits.", group: "codegen", kind: "representation", state: "derived", specKeys: [], sourcePaths: ["compiler"] },
		{ id: "runtime-kit", label: "Runtime kit", description: "Validated installed runtime kit discovered by exact prefix.", group: "codegen", kind: "runtime", state: "current", specKeys: ["execution--runtime--runtime-feature-flags"], sourcePaths: ["compiler"] },
		{ id: "rust-runtime-host-compatibility", label: "Rust runtime/host compatibility", description: "Visible retiring Rust compatibility path, not production lowering.", group: "codegen", kind: "runtime", state: "retiring", specKeys: ["execution--abi-and-host--extern-dispatch-and-policy"], sourcePaths: ["compiler"] },
		{ id: "native-artifact", label: "Native artifact", description: "Native executable or library produced by AOT compilation.", group: "codegen", kind: "artifact", state: "current", specKeys: [], sourcePaths: ["compiler"] },
		{ id: "cli", label: "CLI", description: "Command-line build and run boundary.", group: "tooling", kind: "tool", state: "current", specKeys: ["compiler--build-pipeline--build-and-run-orchestration"], sourcePaths: ["compiler/crates"] },
		{ id: "lsp", label: "LSP", description: "Language-server boundary backed by generation-safe facts.", group: "tooling", kind: "tool", state: "current", specKeys: [], sourcePaths: ["compiler/crates"] },
		{ id: "vs-code", label: "VS Code", description: "BSOL-only editor extension boundary.", group: "tooling", kind: "tool", state: "current", specKeys: [], sourcePaths: ["beskid_vscode"] },
		{ id: "tree-sitter", label: "Tree-sitter", description: "Editor syntax-highlighting boundary.", group: "tooling", kind: "tool", state: "current", specKeys: [], sourcePaths: ["beskid_treesitter"] },
	],
	edges: [
		...BuildTraversal.slice(0, -1).map((from, index) =>
			edge(
				`${from}-to-${BuildTraversal[index + 1]}`,
				from,
				BuildTraversal[index + 1]!,
				"transforms",
				"Build stage",
				"Feeds the next AOT build stage.",
			),
		),
		edge("tree-sitter-to-vs-code", "tree-sitter", "vs-code", "supports", "Syntax support", "Provides editor syntax support."),
		edge("vs-code-to-lsp", "vs-code", "lsp", "supports", "Language tooling", "Connects the editor extension to the language server."),
		edge("lsp-to-generation-safe-facts", "lsp", "generation-safe-facts", "derives", "Semantic queries", "Queries generation-bound semantic facts."),
		edge("generation-safe-facts-to-diagnostics", "generation-safe-facts", "diagnostics", "derives", "Diagnostics", "Derives diagnostics from semantic facts."),
		edge("openspec-to-catalog", "openspec", "openspec-catalog", "derives", "Catalog generation", "Generates the canonical public catalog."),
		edge("catalog-to-conformance-evidence", "openspec-catalog", "conformance-evidence", "governs", "Conformance scope", "Identifies the requirements covered by evidence."),
		edge("conformance-evidence-to-codegen-input", "conformance-evidence", "codegen-input", "evidences", "Lowering evidence", "Records conformance evidence for the lowering contract."),
		edge("conformance-evidence-to-codegen-artifact", "conformance-evidence", "codegen-artifact", "evidences", "Artifact evidence", "Records conformance evidence for generated artifacts."),
		edge("bsol-manifest-to-workspace-resolver", "bsol-manifest", "workspace-resolver", "declares", "Workspace declaration", "Declares the workspace resolved for compilation."),
		edge("pckg-to-workspace-resolver", "pckg", "workspace-resolver", "resolves", "Package resolution", "Supplies registered dependencies to workspace resolution."),
		edge("corelib-to-workspace-resolver", "corelib", "workspace-resolver", "resolves", "Corelib resolution", "Injects corelib through workspace resolution."),
		edge("compiler-mods-to-expanded-syntax", "compiler-mods", "expanded-syntax-assembly", "transforms", "Compiler expansion", "Contributes compiler-mod transformations to expanded syntax."),
		edge("parser-to-expanded-syntax", "parser", "expanded-syntax-assembly", "parses", "Syntax assembly", "Feeds parsed syntax into immutable expanded assembly."),
		edge("typed-hir-to-typed-program", "typed-hir-compatibility", "typed-program", "supports", "Compatibility preparation", "Keeps the transitional typed-HIR preparation path visible."),
		edge("abi-manifest-to-generated-abi", "abi-manifest", "generated-abi", "derives", "ABI generation", "Generates bindings from the versioned ABI manifest."),
		edge("generated-abi-to-runtime-kit", "generated-abi", "runtime-kit", "packages", "Runtime ABI", "Packages generated ABI bindings with runtime kits."),
		edge("rust-runtime-host-to-runtime-kit", "rust-runtime-host-compatibility", "runtime-kit", "supports", "Host compatibility", "Keeps the retiring Rust host path visible beside runtime kits."),
		edge("cli-to-workspace-resolver", "cli", "workspace-resolver", "executes", "Build orchestration", "Starts workspace resolution for CLI builds."),
	],
	traversals: {
		build: BuildTraversal,
		ide: IdeTraversal,
		"spec-to-code": SpecToCodeTraversal,
	},
};
