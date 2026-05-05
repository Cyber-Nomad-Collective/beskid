/**
 * Remark plugin: `arch` fenced code blocks → architecture graph shell HTML + JSON payload.
 */
import { parseMermaidC4ToGraph } from './architecture-graph-c4.mjs';

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function renderArchitectureGraphShellHtml(id, graph) {
	const title = escapeHtml(graph.title ?? 'Architecture graph');
	const description = graph.description
		? `<p class="architecture-graph-shell__desc">${escapeHtml(graph.description)}</p>`
		: '';
	const payload = escapeHtml(JSON.stringify(graph));
	return [
		`<section class="architecture-graph-shell" data-architecture-graph-root data-graph-id="${id}">`,
		`<header class="architecture-graph-shell__header">`,
		`<div><h2 class="architecture-graph-shell__title">${title}</h2>${description}</div>`,
		`<div class="architecture-graph-shell__actions"><button type="button" data-architecture-graph-fit>Fit</button><button type="button" data-architecture-graph-collapse>Collapse all</button><button type="button" data-architecture-graph-expand>Expand all</button></div>`,
		`</header>`,
		`<div class="architecture-graph-shell__toolbar">`,
		`<input type="search" placeholder="Search nodes..." autocomplete="off" data-architecture-graph-search aria-label="Search architecture graph nodes" />`,
		`<div class="architecture-graph-shell__groups" data-architecture-graph-groups></div>`,
		`</div>`,
		`<div class="architecture-graph-shell__layout">`,
		`<div class="architecture-graph-shell__canvas-wrap"><div class="architecture-graph-shell__canvas" data-architecture-graph-canvas aria-label="Architecture graph canvas"></div><div class="architecture-graph-shell__legend" data-architecture-graph-legend></div></div>`,
		`<aside class="architecture-graph-shell__panel" data-architecture-graph-panel><h3 class="architecture-graph-shell__panel-title" data-architecture-graph-panel-title>Select a node</h3><p class="architecture-graph-shell__panel-meta" data-architecture-graph-panel-meta>Click a node to inspect details.</p><p data-architecture-graph-panel-desc></p><h4 class="architecture-graph-shell__panel-section">Metadata</h4><dl data-architecture-graph-panel-kv></dl><h4 class="architecture-graph-shell__panel-section">Relations</h4><ul data-architecture-graph-panel-rels></ul><a href="#" hidden data-architecture-graph-panel-link>Open linked document</a></aside>`,
		`</div>`,
		`</section>`,
		`<script type="application/json" id="${id}-data">${payload}</script>`,
	].join('');
}

/** @returns {import('unified').Plugin} */
export function createRemarkArchCodeFence() {
	return (tree, file) => {
		let sequence = 0;
		const walk = (node) => {
			if (!node || !Array.isArray(node.children)) return;
			const nextChildren = [];
			for (const child of node.children) {
				const lang = typeof child.lang === 'string' ? child.lang.trim().toLowerCase() : '';
				if (child.type === 'code' && lang === 'arch') {
					sequence += 1;
					const source = String(child.value ?? '');
					const { graph, diagnostics, hash } = parseMermaidC4ToGraph(source, {
						title: undefined,
					});
					const graphId = `arch-graph-${hash}-${sequence}`;
					if (diagnostics.length) {
						for (const msg of diagnostics) file.message(msg);
					}
					nextChildren.push({
						type: 'html',
						value: renderArchitectureGraphShellHtml(graphId, graph),
					});
					continue;
				}
				walk(child);
				nextChildren.push(child);
			}
			node.children = nextChildren;
		};
		walk(tree);
	};
}
