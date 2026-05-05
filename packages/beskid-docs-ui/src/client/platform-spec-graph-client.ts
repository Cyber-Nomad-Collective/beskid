import * as d3 from 'd3';
import { escapeHtml, renderRelatedTopicsSection, type RelatedTopicPayload } from 'trudoc/platform-spec';

type GraphPayloadNode = {
	id: string;
	label: string;
	level: 'root' | 'domain' | 'area' | 'feature';
	domainKey?: string;
	domain?: string;
	areaPath?: string;
	href?: string;
	hidden?: boolean;
	displayTitle?: string;
	description?: string;
	specLevel?: string;
	status?: string;
	ownerName?: string;
	relatedTopics?: RelatedTopicPayload[];
};

type GraphPayloadEdge = {
	id: string;
	from: string;
	to: string;
	hidden?: boolean;
	label?: string;
	title?: string;
};

type GraphPayload = {
	nodes: GraphPayloadNode[];
	edges: GraphPayloadEdge[];
};

type SimNode = GraphPayloadNode & {
	x: number;
	y: number;
	vx: number;
	vy: number;
	fx?: number | null;
	fy?: number | null;
};

type SimEdge = GraphPayloadEdge & {
	source: string | SimNode;
	target: string | SimNode;
};

const MAP_SEARCH_LEVEL_ORDER: GraphPayloadNode['level'][] = ['root', 'domain', 'area', 'feature'];
const MAP_SEARCH_LEVEL_HEADING: Record<GraphPayloadNode['level'], string> = {
	root: 'Hub',
	domain: 'Domains',
	area: 'Areas',
	feature: 'Topics & features',
};

function normalizePathish(v: string): string {
	return v.trim().replace(/^\/+|\/+$/g, '');
}

function levelLabel(level: GraphPayloadNode['level']): string {
	switch (level) {
		case 'root':
			return 'Hub';
		case 'domain':
			return 'Domain';
		case 'area':
			return 'Area';
		default:
			return 'Feature';
	}
}

function nodeRadius(level: GraphPayloadNode['level']): number {
	switch (level) {
		case 'root':
			return 58;
		case 'domain':
			return 46;
		case 'area':
			return 38;
		default:
			return 30;
	}
}

const GRAPH_COLOR_FALLBACK: Record<
	GraphPayloadNode['level'],
	{ fill: string; stroke: string; text: string }
> = {
	root: { fill: '#0f4067', stroke: '#55b8ff', text: '#eaf6ff' },
	domain: { fill: '#1e6ca8', stroke: '#7ed6ff', text: '#f0fbff' },
	area: { fill: '#2c84c4', stroke: '#8be5ff', text: '#f0fbff' },
	feature: { fill: '#47a3d6', stroke: '#a9efff', text: '#f0fbff' },
};

const GRAPH_LEVEL_CSS_VARS: Record<GraphPayloadNode['level'], { fill: string; stroke: string; text: string }> = {
	root: {
		fill: '--platform-spec-graph-node-root-fill',
		stroke: '--platform-spec-graph-node-root-stroke',
		text: '--platform-spec-graph-node-root-text',
	},
	domain: {
		fill: '--platform-spec-graph-node-domain-fill',
		stroke: '--platform-spec-graph-node-domain-stroke',
		text: '--platform-spec-graph-node-domain-text',
	},
	area: {
		fill: '--platform-spec-graph-node-area-fill',
		stroke: '--platform-spec-graph-node-area-stroke',
		text: '--platform-spec-graph-node-area-text',
	},
	feature: {
		fill: '--platform-spec-graph-node-feature-fill',
		stroke: '--platform-spec-graph-node-feature-stroke',
		text: '--platform-spec-graph-node-feature-text',
	},
};

function readCssColorVar(name: string, fallback: string): string {
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return raw ? raw : fallback;
}

function nodeColors(node: GraphPayloadNode) {
	const fb = GRAPH_COLOR_FALLBACK[node.level];
	const v = GRAPH_LEVEL_CSS_VARS[node.level];
	return {
		fill: readCssColorVar(v.fill, fb.fill),
		stroke: readCssColorVar(v.stroke, fb.stroke),
		text: readCssColorVar(v.text, fb.text),
	};
}

function nodeFontSize(level: GraphPayloadNode['level']): number {
	switch (level) {
		case 'root':
			return 14;
		case 'domain':
			return 12.5;
		case 'area':
			return 11.5;
		default:
			return 10.5;
	}
}

function nodeLabelLimit(level: GraphPayloadNode['level']): number {
	switch (level) {
		case 'root':
			return 22;
		case 'domain':
			return 28;
		case 'area':
			return 32;
		default:
			return 36;
	}
}

function effectiveNodeRadius(node: GraphPayloadNode): number {
	const base = nodeRadius(node.level);
	const label = (node.displayTitle ?? node.label ?? '').trim();
	const limit = nodeLabelLimit(node.level);
	const overflow = Math.max(0, label.length - limit);
	return base + Math.min(overflow * 0.75, 26);
}

function readGraphPayload(): GraphPayload | null {
	const el = document.getElementById('platform-spec-graph-data');
	if (!el?.textContent?.trim()) return null;
	try {
		return JSON.parse(el.textContent) as GraphPayload;
	} catch {
		return null;
	}
}

function syncMapChromeInsets() {
	const mapPage = document.querySelector<HTMLElement>('.platform-spec-map-page');
	const topbar = document.querySelector<HTMLElement>('.page > .header');
	if (!mapPage || !topbar) return;
	const footer = document.querySelector<HTMLElement>('footer');
	const viewH = window.innerHeight;
	const topPx = topbar.getBoundingClientRect().bottom;
	const footerRect = footer?.getBoundingClientRect();
	const footerVisible =
		Boolean(footerRect) &&
		footerRect.height > 0 &&
		window.getComputedStyle(footer as HTMLElement).display !== 'none' &&
		window.getComputedStyle(footer as HTMLElement).visibility !== 'hidden';
	const footerTop = footerVisible && footerRect ? footerRect.top : viewH;
	const bottomBound = Math.max(topPx, Math.min(viewH, footerTop));
	const available = Math.max(280, bottomBound - topPx);
	const bottomPx = Math.max(0, viewH - bottomBound);
	document.documentElement.style.setProperty('--platform-spec-panel-top', `${topPx}px`);
	document.documentElement.style.setProperty('--platform-spec-panel-bottom', `${bottomPx}px`);
	mapPage.style.setProperty('--platform-spec-available-height', `${available}px`);
}

function nodeIdFromHref(href: string): string | null {
	const n = normalizePathish(href);
	if (!n) return null;
	if (n === 'platform-spec') return 'beskid';
	if (n.startsWith('platform-spec/')) {
		const parts = n.split('/');
		if (parts.length === 2) return `domain:${parts[1]}`;
		if (parts.length === 3) return `area:${parts[1]}/${parts[2]}`;
		return `feat:${n}`;
	}
	return null;
}

export function mountPlatformSpecGraph(): void {
	const graph = readGraphPayload();
	const mountEl = document.getElementById('platform-spec-graph');
	const layoutEl = document.querySelector<HTMLElement>('[data-platform-spec-graph-layout]');
	const panelEl = document.getElementById('platform-spec-graph-panel');
	if (!graph || !mountEl || !layoutEl || !panelEl) return;

	syncMapChromeInsets();
	window.addEventListener('resize', syncMapChromeInsets, { passive: true });
	const applyMapLegendSwatches = () => {
		const legend = document.querySelector('.platform-spec-map-legend');
		if (!legend) return;
		for (const level of Object.keys(GRAPH_LEVEL_CSS_VARS) as GraphPayloadNode['level'][]) {
			const el = legend.querySelector<HTMLElement>(`[data-platform-spec-legend-swatch="${level}"]`);
			if (!el) continue;
			const fb = GRAPH_COLOR_FALLBACK[level];
			const v = GRAPH_LEVEL_CSS_VARS[level];
			el.style.backgroundColor = readCssColorVar(v.fill, fb.fill);
			el.style.borderColor = readCssColorVar(v.stroke, fb.stroke);
		}
	};
	applyMapLegendSwatches();

	const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
	const outgoingByNode = new Map<string, GraphPayloadEdge[]>();
	const incomingByNode = new Map<string, GraphPayloadEdge[]>();
	for (const edge of graph.edges) {
		const out = outgoingByNode.get(edge.from) ?? [];
		out.push(edge);
		outgoingByNode.set(edge.from, out);
		const incoming = incomingByNode.get(edge.to) ?? [];
		incoming.push(edge);
		incomingByNode.set(edge.to, incoming);
	}

	const visibility = new Map(graph.nodes.map((n) => [n.id, !Boolean(n.hidden)]));
	for (const edge of graph.edges) {
		if (edge.hidden) visibility.set(edge.to, false);
	}

	const parentMap = new Map<string, string>();
	for (const edge of graph.edges) parentMap.set(edge.to, edge.from);

	const width = Math.max(900, mountEl.clientWidth || 900);
	const height = Math.max(620, mountEl.clientHeight || 620);
	const svg = d3
		.select(mountEl)
		.html('')
		.append('svg')
		.attr('class', 'platform-spec-map-svg')
		.attr('viewBox', `0 0 ${width} ${height}`)
		.attr('width', '100%')
		.attr('height', '100%');

	const graphLayer = svg.append('g').attr('class', 'platform-spec-map-svg__layer');
	const edgeLayer = graphLayer.append('g');
	const edgeLabelLayer = graphLayer.append('g');
	const nodeLayer = graphLayer.append('g');

	const simNodes: SimNode[] = graph.nodes.map((node, i) => ({
		...node,
		x: width / 2 + (i % 9) * 32 - 120,
		y: height / 2 + Math.floor(i / 9) * 28 - 90,
		vx: 0,
		vy: 0,
	}));
	const simEdges: SimEdge[] = graph.edges.map((edge) => ({ ...edge, source: edge.from, target: edge.to }));

	const simulation = d3
		.forceSimulation<SimNode>(simNodes)
		.force('charge', d3.forceManyBody().strength(-360))
		.force(
			'link',
			d3
				.forceLink<SimNode, SimEdge>(simEdges)
				.id((d) => d.id)
				.distance((e) => {
					const targetId = typeof e.target === 'string' ? e.target : e.target.id;
					const target = nodeById.get(targetId);
					return target?.level === 'domain' ? 150 : target?.level === 'area' ? 120 : 95;
				}),
		)
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collide', d3.forceCollide((n) => effectiveNodeRadius(n) + 14));

	const zoomMin = 0.25;
	const zoomMax = 3.4;
	const zoom = d3
		.zoom<SVGSVGElement, unknown>()
		.scaleExtent([zoomMin, zoomMax])
		.on('zoom', (event) => {
			graphLayer.attr('transform', event.transform.toString());
		});
	svg.call(zoom as any);

	const edgeSel = edgeLayer
		.selectAll<SVGLineElement, SimEdge>('line')
		.data(simEdges, (d: any) => d.id)
		.join('line')
		.attr('class', 'platform-spec-map-svg__edge');

	const edgeLabelSel = edgeLabelLayer
		.selectAll<SVGTextElement, SimEdge>('text')
		.data(simEdges.filter((e) => e.label), (d: any) => d.id)
		.join('text')
		.attr('class', 'platform-spec-map-svg__edge-label')
		.text((d) => d.label ?? '');

	const nodeSel = nodeLayer
		.selectAll<SVGGElement, SimNode>('g')
		.data(simNodes, (d: any) => d.id)
		.join('g')
		.attr('class', 'platform-spec-map-svg__node');

	nodeSel
		.append('circle')
		.attr('r', (d) => effectiveNodeRadius(d))
		.attr('fill', (d) => nodeColors(d).fill)
		.attr('stroke', (d) => nodeColors(d).stroke)
		.attr('stroke-width', (d) => (d.level === 'root' ? 2.8 : 2));

	nodeSel
		.append('text')
		.attr('class', 'platform-spec-map-svg__label')
		.attr('text-anchor', 'middle')
		.attr('dy', 4)
		.attr('font-size', (d) => `${nodeFontSize(d.level)}px`)
		.attr('fill', (d) => nodeColors(d).text)
		.text((d) => {
			const label = d.displayTitle ?? d.label;
			const limit = nodeLabelLimit(d.level);
			return label.length > limit ? `${label.slice(0, limit - 1)}…` : label;
		});

	nodeSel.call(
		d3
			.drag<SVGGElement, SimNode>()
			.on('start', (event, d) => {
				if (!event.active) simulation.alphaTarget(0.23).restart();
				d.fx = d.x;
				d.fy = d.y;
			})
			.on('drag', (event, d) => {
				d.fx = event.x;
				d.fy = event.y;
			})
			.on('end', (event, d) => {
				if (!event.active) simulation.alphaTarget(0);
				d.fx = null;
				d.fy = null;
			}) as any,
	);

	function edgeVisible(edge: SimEdge): boolean {
		const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
		const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
		return Boolean(visibility.get(sourceId) && visibility.get(targetId));
	}

	function applyVisibility() {
		nodeSel.attr('display', (d) => (visibility.get(d.id) ? null : 'none'));
		edgeSel.attr('display', (d) => (edgeVisible(d) ? null : 'none'));
		edgeLabelSel.attr('display', (d) => (edgeVisible(d) ? null : 'none'));
	}

	function fitVisible(duration = 320) {
		const visibleNodes = simNodes.filter((n) => visibility.get(n.id));
		if (!visibleNodes.length) return;
		const minX = d3.min(visibleNodes, (n) => n.x) ?? 0;
		const maxX = d3.max(visibleNodes, (n) => n.x) ?? width;
		const minY = d3.min(visibleNodes, (n) => n.y) ?? 0;
		const maxY = d3.max(visibleNodes, (n) => n.y) ?? height;
		const pad = 80;
		const boxW = Math.max(10, maxX - minX + pad * 2);
		const boxH = Math.max(10, maxY - minY + pad * 2);
		const scale = Math.max(0.28, Math.min(2.85, Math.min(width / boxW, height / boxH)));
		const tx = width / 2 - ((minX + maxX) / 2) * scale;
		const ty = height / 2 - ((minY + maxY) / 2) * scale;
		svg.transition().duration(duration).call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
	}

	function collapseAllBelowDomains() {
		for (const node of graph.nodes) {
			if (node.level === 'area' || node.level === 'feature') visibility.set(node.id, false);
		}
		applyVisibility();
		fitVisible();
	}

	function showAllNodes() {
		for (const node of graph.nodes) visibility.set(node.id, true);
		applyVisibility();
		fitVisible();
	}

	function toggleAreasForDomain(domain: string) {
		const areaNodes = graph.nodes.filter((n) => n.level === 'area' && n.domain === domain);
		if (!areaNodes.length) return;
		const nowHidden = !visibility.get(areaNodes[0].id);
		for (const area of areaNodes) {
			visibility.set(area.id, nowHidden);
			if (!nowHidden) {
				for (const feat of graph.nodes.filter((n) => n.level === 'feature' && n.areaPath === area.areaPath)) {
					visibility.set(feat.id, false);
				}
			}
		}
		applyVisibility();
		fitVisible();
	}

	function toggleFeaturesForArea(areaPath: string) {
		const features = graph.nodes.filter((n) => n.level === 'feature' && n.areaPath === areaPath);
		if (!features.length) return;
		const nextState = !visibility.get(features[0].id);
		for (const feat of features) visibility.set(feat.id, nextState);
		applyVisibility();
		fitVisible();
	}

	const titleEl = document.getElementById('platform-spec-graph-panel-title');
	const metaEl = document.getElementById('platform-spec-graph-panel-meta');
	const descEl = document.getElementById('platform-spec-graph-panel-desc');
	const dlEl = document.getElementById('platform-spec-graph-panel-dl');
	const relsEl = document.getElementById('platform-spec-graph-panel-relations-rels');
	const relCountEl = document.getElementById('platform-spec-graph-panel-relations-count');
	const relatedRoot = document.getElementById('platform-spec-graph-panel-related-root');
	const hintEl = document.getElementById('platform-spec-graph-panel-hint');
	const linkEl = document.getElementById('platform-spec-graph-panel-link') as HTMLAnchorElement | null;
	const closeBtn = document.getElementById('platform-spec-graph-panel-close');

	function openPanel() {
		layoutEl.classList.add('platform-spec-graph-layout--panel-open');
		panelEl.setAttribute('aria-hidden', 'false');
		syncMapChromeInsets();
	}

	function closePanel() {
		layoutEl.classList.remove('platform-spec-graph-layout--panel-open');
		panelEl.setAttribute('aria-hidden', 'true');
	}

	function revealNodePath(node: GraphPayloadNode) {
		let cursor: string | undefined = node.id;
		while (cursor) {
			visibility.set(cursor, true);
			cursor = parentMap.get(cursor);
		}
	}

	function focusNode(node: GraphPayloadNode) {
		revealNodePath(node);
		applyVisibility();
		const target = simNodes.find((n) => n.id === node.id);
		if (target) {
			const baseScale =
				node.level === 'root' ? 1.08 : node.level === 'domain' ? 1.38 : node.level === 'area' ? 1.58 : 1.88;
			const r = effectiveNodeRadius(node);
			const radiusBoost = Math.min(1.28, 52 / Math.max(26, r));
			const scale = Math.min(zoomMax, Math.max(zoomMin + 0.02, baseScale * radiusBoost));
			svg
				.transition()
				.duration(380)
				.call(zoom.transform as any, d3.zoomIdentity.translate(width / 2 - target.x * scale, height / 2 - target.y * scale).scale(scale));
		}
		updatePanel(node);
	}

	function graphNodeLinkLabel(t: GraphPayloadNode): string {
		const label = escapeHtml(t.displayTitle ?? t.label);
		if (t.href) {
			return `<a class="platform-spec-graph-panel__rels-link" href="${escapeHtml(t.href)}">${label}</a>`;
		}
		return label;
	}

	function updatePanel(node: GraphPayloadNode) {
		if (!titleEl || !metaEl || !descEl || !dlEl || !relsEl || !hintEl || !linkEl) return;
		titleEl.textContent = node.displayTitle ?? node.label;
		metaEl.textContent = `${levelLabel(node.level)} · ${node.id}`;
		descEl.textContent = node.description ?? '';
		const rows: string[] = [];
		if (node.ownerName) rows.push(`<dt>Owner</dt><dd>${escapeHtml(node.ownerName)}</dd>`);
		if (node.status) rows.push(`<dt>Spec standing</dt><dd>${escapeHtml(node.status)}</dd>`);
		if (node.specLevel) rows.push(`<dt>Spec level</dt><dd>${escapeHtml(node.specLevel)}</dd>`);
		dlEl.innerHTML = rows.join('');
		dlEl.hidden = rows.length === 0;

		if (relatedRoot) {
			const rt = node.relatedTopics ?? [];
			if (rt.length) {
				relatedRoot.innerHTML = renderRelatedTopicsSection(rt, {
					heading: 'Related spec docs',
					headingId: 'platform-spec-graph-related-heading',
					rootClass: 'related-topics--graph-panel',
				});
				relatedRoot.hidden = false;
			} else {
				relatedRoot.innerHTML = '';
				relatedRoot.hidden = true;
			}
		}

		const relRows: string[] = [];
		const outgoing = (outgoingByNode.get(node.id) ?? []).filter((e) => visibility.get(e.to));
		const incoming = (incomingByNode.get(node.id) ?? []).filter((e) => visibility.get(e.from));
		for (const e of outgoing) {
			const t = nodeById.get(e.to);
			if (!t) continue;
			relRows.push(`<li><strong>→ ${graphNodeLinkLabel(t)}</strong>${e.label ? ` (${escapeHtml(e.label)})` : ''}</li>`);
		}
		for (const e of incoming) {
			const t = nodeById.get(e.from);
			if (!t) continue;
			relRows.push(`<li><strong>← ${graphNodeLinkLabel(t)}</strong>${e.label ? ` (${escapeHtml(e.label)})` : ''}</li>`);
		}
		relsEl.innerHTML = relRows.length ? relRows.join('') : '<li>No node relation notes available for visible edges.</li>';
		if (relCountEl) relCountEl.textContent = `${relRows.length}`;

		hintEl.textContent =
			node.level === 'root'
				? 'Click hub to collapse to domains.'
				: node.level === 'domain'
					? 'Click domain to toggle areas.'
					: node.level === 'area'
						? 'Click area to toggle feature pages.'
						: 'Double-click to open this feature page.';
		if (node.href) {
			linkEl.href = node.href;
			linkEl.hidden = false;
		} else {
			linkEl.hidden = true;
		}
		openPanel();
	}

	nodeSel.on('click', (_, d) => {
		const node = nodeById.get(d.id);
		if (!node) return;
		if (node.level === 'root') {
			collapseAllBelowDomains();
		} else if (node.level === 'domain' && node.domain) {
			toggleAreasForDomain(node.domain);
		} else if (node.level === 'area' && node.areaPath) {
			toggleFeaturesForArea(node.areaPath);
		}
		updatePanel(node);
	});

	nodeSel.on('dblclick', (_, d) => {
		const node = nodeById.get(d.id);
		if (node?.href) window.location.href = node.href;
	});

	const fitBtn = document.getElementById('platform-spec-map-fit');
	const collapseBtn = document.getElementById('platform-spec-map-collapse');
	const expandBtn = document.getElementById('platform-spec-map-expand');
	const optsOpenBtn = document.getElementById('platform-spec-map-options-open');
	const optsWrap = document.getElementById('platform-spec-map-options');
	const optsShowAllBtn = document.getElementById('platform-spec-map-show-all');
	const optsHideAllBtn = document.getElementById('platform-spec-map-hide-all');
	const optsResetViewBtn = document.getElementById('platform-spec-map-reset-view');
	fitBtn?.addEventListener('click', () => fitVisible());
	collapseBtn?.addEventListener('click', () => collapseAllBelowDomains());
	expandBtn?.addEventListener('click', () => showAllNodes());
	optsOpenBtn?.addEventListener('click', () => {
		if (!optsWrap) return;
		optsWrap.hidden = !optsWrap.hidden;
	});
	optsShowAllBtn?.addEventListener('click', () => showAllNodes());
	optsHideAllBtn?.addEventListener('click', () => collapseAllBelowDomains());
	optsResetViewBtn?.addEventListener('click', () => fitVisible());
	closeBtn?.addEventListener('click', () => closePanel());

	const searchFab = document.getElementById('platform-spec-map-search-open');
	const searchWrap = document.getElementById('platform-spec-map-search');
	const searchClose = document.getElementById('platform-spec-map-search-close');
	const searchInput = document.getElementById('platform-spec-map-search-input') as HTMLInputElement | null;
	const searchResults = document.getElementById('platform-spec-map-search-results');

	function renderSearchResults(term: string) {
		if (!searchResults) return;
		const q = term.trim().toLowerCase();
		const filtered = graph.nodes.filter((n) => {
			if (!q) return true;
			const hay = `${n.displayTitle ?? n.label} ${n.id} ${n.level} ${n.domain ?? ''} ${n.areaPath ?? ''}`.toLowerCase();
			return hay.includes(q);
		});
		const byLevel = new Map<GraphPayloadNode['level'], GraphPayloadNode[]>();
		for (const level of MAP_SEARCH_LEVEL_ORDER) byLevel.set(level, []);
		for (const node of filtered) byLevel.get(node.level)?.push(node);
		const sections: string[] = [];
		for (const level of MAP_SEARCH_LEVEL_ORDER) {
			const group = (byLevel.get(level) ?? []).sort((a, b) =>
				(a.displayTitle ?? a.label).localeCompare(b.displayTitle ?? b.label, undefined, { sensitivity: 'base' }),
			);
			if (!group.length) continue;
			const items = group
				.map(
					(n) =>
						`<li><button type="button" class="platform-spec-map-search__item" data-node-id="${escapeHtml(n.id)}"><strong>${escapeHtml(n.displayTitle ?? n.label)}</strong><span>${escapeHtml(n.level)} · ${escapeHtml(n.id)}</span></button></li>`,
				)
				.join('');
			sections.push(`<section class="platform-spec-map-search__group"><h4 class="platform-spec-map-search__group-title">${escapeHtml(MAP_SEARCH_LEVEL_HEADING[level])}</h4><ul class="platform-spec-map-search__group-list">${items}</ul></section>`);
		}
		searchResults.innerHTML = sections.length ? sections.join('') : '<p class="platform-spec-map-search__empty">No nodes match your search.</p>';
		if (searchClose && searchInput) searchClose.hidden = searchInput.value.trim().length === 0;
	}

	function closeSearch() {
		if (!searchWrap) return;
		searchWrap.hidden = true;
		searchFab?.setAttribute('aria-expanded', 'false');
	}

	function openSearch() {
		if (!searchWrap) return;
		searchWrap.hidden = false;
		searchFab?.setAttribute('aria-expanded', 'true');
		searchInput?.focus();
	}

	searchFab?.addEventListener('click', () => {
		if (!searchWrap) return;
		if (searchWrap.hidden) openSearch();
		else closeSearch();
	});
	searchClose?.addEventListener('click', (event) => {
		event.preventDefault();
		if (!searchInput) return;
		searchInput.value = '';
		renderSearchResults('');
		searchInput.focus();
	});
	searchInput?.addEventListener('input', () => renderSearchResults(searchInput.value));
	searchResults?.addEventListener('click', (event) => {
		const target = (event.target as HTMLElement).closest<HTMLElement>('[data-node-id]');
		if (!target) return;
		const id = target.getAttribute('data-node-id');
		if (!id) return;
		const node = nodeById.get(id);
		if (!node) return;
		focusNode(node);
		closeSearch();
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') closeSearch();
	});
	renderSearchResults('');

	const urlNode = new URL(window.location.href).searchParams.get('node');
	if (urlNode) {
		const direct = nodeById.get(urlNode) ?? nodeById.get(nodeIdFromHref(urlNode) ?? '');
		if (direct) setTimeout(() => focusNode(direct), 220);
	}

	simulation.on('tick', () => {
		edgeSel
			.attr('x1', (d: any) => d.source.x)
			.attr('y1', (d: any) => d.source.y)
			.attr('x2', (d: any) => d.target.x)
			.attr('y2', (d: any) => d.target.y);
		edgeLabelSel
			.attr('x', (d: any) => (d.source.x + d.target.x) / 2)
			.attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 6);
		nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
	});

	applyVisibility();
	setTimeout(() => fitVisible(), 280);
}

mountPlatformSpecGraph();
