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
		`<h2 class="architecture-graph-shell__title">${title}</h2>${description}`,
		`</header>`,
		`<div class="architecture-graph-shell__canvas" data-architecture-graph-canvas aria-label="Architecture graph canvas"></div>`,
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
