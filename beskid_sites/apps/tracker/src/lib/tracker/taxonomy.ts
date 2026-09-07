/**
 * Tracker component taxonomy (superrepo layout). Subcomponents mirror top-level
 * crates, packages, and services for routing reports to the right owners.
 */
import {
	findTitleField,
	type ReportFormLayout,
	reportField,
	reportGroup,
	reportSection,
} from "#/lib/report-issue/fields";

export type TrackerReportKind = "bug" | "task";

export interface TrackerSubcomponent {
	id: string;
	label: string;
}

export interface TrackerComponent {
	id: string;
	label: string;
	description: string;
	subcomponents: TrackerSubcomponent[];
	bugLayout: ReportFormLayout;
	taskLayout: ReportFormLayout;
}

/** Jira-style bug form: summary, meta row, outcome, repro steps, attachments. */
const baseBugLayout = (extra: ReportFormLayout = []): ReportFormLayout => [
	reportSection(
		"overview",
		"Details",
		[
			reportField({
				id: "title",
				kind: "title",
				label: "Summary",
				required: true,
				placeholder: "What went wrong in one line?",
			}),
			...(extra.length > 0
				? [
						reportGroup("bug-meta", "horizontal", extra, undefined, {
							dense: true,
						}),
					]
				: []),
		],
		"Give maintainers enough context to triage quickly.",
	),
	reportSection("outcome", "Expected vs actual", [
		reportGroup("bug-outcome", "horizontal", [
			reportField({
				id: "expected",
				kind: "markdown",
				label: "Expected behavior",
				placeholder: "What should have happened?",
				rows: 4,
			}),
			reportField({
				id: "actual",
				kind: "markdown",
				label: "Actual behavior",
				placeholder: "What happened instead?",
				rows: 4,
			}),
		]),
	]),
	reportSection(
		"reproduction",
		"Steps to reproduce",
		[
			reportField({
				id: "steps",
				kind: "steps",
				label: "Reproduction steps",
				placeholder: "Describe this step…",
				hint: "Numbered steps are added to the GitHub issue body.",
			}),
		],
		"Walk through the smallest path that triggers the bug.",
	),
	reportSection("attachments", "Attachments", [
		reportField({
			id: "attachments",
			kind: "attachments",
			label: "Files",
			hint:
				"Screenshots, logs, or recordings (uploaded after the issue is created).",
		}),
	]),
];

const baseTaskLayout = (extra: ReportFormLayout = []): ReportFormLayout => [
	reportSection("task-overview", "Task", [
		reportField({
			id: "title",
			kind: "title",
			label: "Summary",
			required: true,
			placeholder: "Short outcome-oriented summary",
		}),
		...(extra.length > 0
			? [
					reportGroup("task-meta", "horizontal", extra, undefined, {
						dense: true,
					}),
				]
			: []),
	]),
	reportSection(
		"task-description",
		"Description",
		[
			reportField({
				id: "description",
				kind: "markdown",
				label: "Description",
				placeholder: "Context, acceptance criteria, links…",
				rows: 8,
			}),
		],
		"Use markdown for lists, code blocks, and links.",
	),
	reportSection(
		"task-subtasks",
		"Subtasks",
		[
			reportField({
				id: "subtasks",
				kind: "subtasks",
				label: "Subtasks",
				placeholder: "Describe this subtask…",
				hint: "Checklist items are stored as ordered tracker-native subtasks.",
			}),
		],
		"Break work into trackable steps. Checked items map to GitHub `- [x]` syntax.",
	),
];

/** Static taxonomy — update when superrepo layout changes materially. */
export const TRACKER_COMPONENTS: TrackerComponent[] = [
	{
		id: "compiler",
		label: "Compiler",
		description:
			"Rust workspace under `compiler/` (CLI, LSP, analysis, pipeline).",
		subcomponents: [
			{ id: "cli", label: "beskid CLI" },
			{ id: "lsp", label: "Language server" },
			{ id: "analysis", label: "Parser & typechecker" },
			{ id: "pipeline", label: "Pipeline & lowering" },
			{ id: "codegen", label: "Codegen backends" },
			{ id: "compiler-sdk", label: "Compiler SDK / mods host" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "beskid_version",
				kind: "text",
				label: "CLI / Beskid version",
				placeholder: "cli-stable, local build…",
			}),
			reportField({
				id: "repro_command",
				kind: "text",
				label: "Repro command",
				placeholder: "`beskid build …`, fixture name",
			}),
		]),
		taskLayout: baseTaskLayout([
			reportField({
				id: "spec_link",
				kind: "text",
				label: "Platform spec path",
				placeholder: "/platform-spec/…",
			}),
		]),
	},
	{
		id: "corelib",
		label: "Core library",
		description: "`compiler/corelib` / `beskid_corelib` standard packages.",
		subcomponents: [
			{ id: "foundation", label: "foundation / Core" },
			{ id: "runtime", label: "runtime / System I/O" },
			{ id: "console", label: "Console & ANSI" },
			{ id: "pack-publish", label: "Pack & publish" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "package_id",
				kind: "text",
				label: "Package",
				placeholder: "corelib, corelib_console…",
			}),
			reportField({
				id: "api_surface",
				kind: "text",
				label: "Type or member",
				placeholder: "Namespace.Type.member",
			}),
		]),
		taskLayout: baseTaskLayout(),
	},
	{
		id: "packages",
		label: "Packages",
		description: "Shared JS/TS libraries under `packages/`.",
		subcomponents: [
			{ id: "beskid-ui", label: "beskid-ui" },
			{ id: "trudoc", label: "trudoc" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "consumer",
				kind: "text",
				label: "Consuming app",
				placeholder: "site/website, pckg…",
			}),
			reportField({
				id: "build_tool",
				kind: "text",
				label: "Toolchain",
				placeholder: "bun, vite, astro…",
			}),
		]),
		taskLayout: baseTaskLayout(),
	},
	{
		id: "build",
		label: "Build & CI",
		description:
			"GitHub Actions, Docker, release scripts, superrepo orchestration.",
		subcomponents: [
			{ id: "github-actions", label: "GitHub Actions" },
			{ id: "docker", label: "Docker / Coolify" },
			{ id: "release", label: "CLI & extension release" },
			{ id: "repo-tool", label: "repo / submodules sync" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "workflow",
				kind: "text",
				label: "Workflow / image",
				placeholder: "docs-site.yml…",
			}),
			reportField({
				id: "run_url",
				kind: "text",
				label: "Failed run URL",
				placeholder: "https://github.com/…/actions/runs/…",
			}),
		]),
		taskLayout: baseTaskLayout(),
	},
	{
		id: "docs",
		label: "Docs site",
		description: "`site/website` — platform spec, book, downloads.",
		subcomponents: [
			{ id: "platform-spec", label: "Platform specification" },
			{ id: "book", label: "Beskid Book" },
			{ id: "downloads", label: "Downloads & install scripts" },
			{ id: "nav-chrome", label: "Nav & reader chrome" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "page_path",
				kind: "text",
				label: "Page path",
				placeholder: "/platform-spec/… or /book/…",
			}),
		]),
		taskLayout: baseTaskLayout(),
	},
	{
		id: "pckg",
		label: "pckg",
		description: "Package registry service (`pckg/`).",
		subcomponents: [
			{ id: "server", label: "API & Blazor host" },
			{ id: "dashboard", label: "Dashboard UI" },
			{ id: "registry", label: "Registry & storage" },
			{ id: "docs-browser", label: "Package docs browser" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "deployment",
				kind: "text",
				label: "Environment",
				placeholder: "local compose, production URL…",
			}),
		]),
		taskLayout: baseTaskLayout(),
	},
	{
		id: "vscode",
		label: "VS Code extension",
		description: "`beskid_vscode` — extension, bundled LSP, Open VSX.",
		subcomponents: [
			{ id: "extension", label: "Extension host" },
			{ id: "lsp-bundle", label: "Bundled LSP" },
			{ id: "open-vsx", label: "Open VSX publish" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "vscode_version",
				kind: "text",
				label: "VS Code version",
			}),
			reportField({
				id: "extension_version",
				kind: "text",
				label: "Extension version",
			}),
		]),
		taskLayout: baseTaskLayout(),
	},
	{
		id: "tracker",
		label: "Tracker",
		description: "This app (`beskid_tracker`).",
		subcomponents: [
			{ id: "bugs", label: "Bug tracker" },
			{ id: "roadmap-ui", label: "Roadmap & kanban" },
			{ id: "auth", label: "GitHub OAuth" },
		],
		bugLayout: baseBugLayout([
			reportField({
				id: "route",
				kind: "text",
				label: "Route or view",
				placeholder: "/bugs, /v/v0.3",
			}),
		]),
		taskLayout: baseTaskLayout(),
	},
];

export function getTrackerComponent(id: string): TrackerComponent | undefined {
	return TRACKER_COMPONENTS.find((c) => c.id === id);
}

export function resolveReportLayout(
	kind: TrackerReportKind,
	componentId: string,
): ReportFormLayout {
	const component = getTrackerComponent(componentId);
	if (!component) {
		return kind === "bug" ? baseBugLayout() : baseTaskLayout();
	}
	return kind === "bug" ? component.bugLayout : component.taskLayout;
}

export { findTitleField };

export function formatTrackerScopeHeader(
	componentId: string,
	subcomponentId: string,
): string {
	const component = getTrackerComponent(componentId);
	const sub = component?.subcomponents.find((s) => s.id === subcomponentId);
	const componentLabel = component?.label ?? componentId;
	const subLabel = sub?.label ?? subcomponentId;
	return `**Component:** ${componentLabel} · **Subcomponent:** ${subLabel}\n\n`;
}
