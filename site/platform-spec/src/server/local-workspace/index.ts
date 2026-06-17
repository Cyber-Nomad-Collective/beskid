import "@tanstack/react-start/server-only";

import fs from "node:fs";
import path from "node:path";
import {
	SPEC_COMMENTS_FILE,
	SPEC_LAYOUT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_WORKSPACE_MANIFEST,
	parseNodeComments,
	parseNodeDocument,
	parseWorkspaceManifest,
	slugFromNodeDir,
	validateWorkspace,
	writeNodeMarkdown,
	type NodeMetadata,
} from "@cyber-nomad-collective/spec-core";

export function localWorkspaceRoot(): string | null {
	const configured = process.env.SPEC_LOCAL_WORKSPACE?.trim();
	if (!configured) return null;
	return path.isAbsolute(configured)
		? configured
		: path.resolve(process.cwd(), configured);
}

function contentRoot(): string {
	const root = localWorkspaceRoot();
	if (!root) throw new Error("SPEC_LOCAL_WORKSPACE is not configured");
	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(path.join(root, SPEC_WORKSPACE_MANIFEST), "utf8")),
	);
	return path.join(root, manifest.contentRoot);
}

function collectNodeDirs(): string[] {
	const root = contentRoot();
	const dirs: string[] = [];
	function walk(dir: string) {
		const markdownPath = path.join(dir, SPEC_MARKDOWN_FILE);
		if (fs.existsSync(markdownPath)) dirs.push(dir);
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				walk(path.join(dir, entry.name));
			}
		}
	}
	walk(root);
	return dirs;
}

export interface LocalSpecNode {
	slug: string;
	node: NodeMetadata;
	bodyMd: string;
	layoutJson: Record<string, unknown> | null;
	commentsJson: Record<string, unknown> | null;
}

export function listLocalNodes(): LocalSpecNode[] {
	const workspace = localWorkspaceRoot();
	if (!workspace) return [];
	const manifest = parseWorkspaceManifest(
		JSON.parse(
			fs.readFileSync(path.join(workspace, SPEC_WORKSPACE_MANIFEST), "utf8"),
		),
	);
	const nodes: LocalSpecNode[] = [];
	for (const nodeDir of collectNodeDirs()) {
		const doc = parseNodeDocument({ nodeDir, workspaceDir: workspace, manifest });
		const node = doc.node;
		const layoutPath = path.join(nodeDir, SPEC_LAYOUT_FILE);
		const commentsPath = path.join(nodeDir, SPEC_COMMENTS_FILE);
		nodes.push({
			slug: node.slug,
			node,
			bodyMd: doc.body,
			layoutJson: fs.existsSync(layoutPath)
				? (JSON.parse(fs.readFileSync(layoutPath, "utf8")) as Record<
						string,
						unknown
					>)
				: null,
			commentsJson: fs.existsSync(commentsPath)
				? (JSON.parse(fs.readFileSync(commentsPath, "utf8")) as Record<
						string,
						unknown
					>)
				: null,
		});
	}
	return nodes.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getLocalNode(slug: string): LocalSpecNode | null {
	return listLocalNodes().find((node) => node.slug === slug) ?? null;
}

export function saveLocalNodeContent(slug: string, bodyMd: string): void {
	const workspace = localWorkspaceRoot();
	if (!workspace) throw new Error("SPEC_LOCAL_WORKSPACE is not configured");
	const manifest = parseWorkspaceManifest(
		JSON.parse(
			fs.readFileSync(path.join(workspace, SPEC_WORKSPACE_MANIFEST), "utf8"),
		),
	);
	const nodeDir = path.join(
		workspace,
		slug.replace(/^platform-spec\/?/, `${manifest.contentRoot}/`).replace(/\/$/, ""),
	);
	writeNodeMarkdown(nodeDir, bodyMd);
}

export function saveLocalNodeLayout(
	slug: string,
	layoutJson: Record<string, unknown>,
): void {
	const workspace = localWorkspaceRoot();
	if (!workspace) throw new Error("SPEC_LOCAL_WORKSPACE is not configured");
	const manifest = parseWorkspaceManifest(
		JSON.parse(
			fs.readFileSync(path.join(workspace, SPEC_WORKSPACE_MANIFEST), "utf8"),
		),
	);
	const nodeDir = path.join(
		workspace,
		slug.replace(/^platform-spec\/?/, `${manifest.contentRoot}/`).replace(/\/$/, ""),
	);
	fs.writeFileSync(
		path.join(nodeDir, SPEC_LAYOUT_FILE),
		`${JSON.stringify(layoutJson, null, 2)}\n`,
	);
}

export function saveLocalNodeComments(
	slug: string,
	commentsJson: Record<string, unknown>,
): void {
	const workspace = localWorkspaceRoot();
	if (!workspace) throw new Error("SPEC_LOCAL_WORKSPACE is not configured");
	const manifest = parseWorkspaceManifest(
		JSON.parse(
			fs.readFileSync(path.join(workspace, SPEC_WORKSPACE_MANIFEST), "utf8"),
		),
	);
	const nodeDir = path.join(
		workspace,
		slug.replace(/^platform-spec\/?/, `${manifest.contentRoot}/`).replace(/\/$/, ""),
	);
	parseNodeComments(commentsJson);
	fs.writeFileSync(
		path.join(nodeDir, SPEC_COMMENTS_FILE),
		`${JSON.stringify(commentsJson, null, 2)}\n`,
	);
}

export function validateLocalWorkspace() {
	const root = localWorkspaceRoot();
	if (!root) throw new Error("SPEC_LOCAL_WORKSPACE is not configured");
	return validateWorkspace(root);
}
