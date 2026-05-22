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

function linkPadding(source: GraphPayloadNode, target: GraphPayloadNode): number {
	if (source.level === 'root' || target.level === 'root') return 36;
	if (source.level === 'domain' || target.level === 'domain') return 28;
	if (source.level === 'area' || target.level === 'area') return 22;
	return 18;
}

function linkDistanceBetween(source: GraphPayloadNode, target: GraphPayloadNode): number {
	return effectiveNodeRadius(source) + effectiveNodeRadius(target) + linkPadding(source, target);
}

/** Place visible nodes on concentric rings so the force sim does not start stacked on one point. */
function seedVisibleLayout(active: SimNode[], cx: number, cy: number, parents: Map<string, string>) {
	const root = active.find((n) => n.level === 'root');
	if (root) {
		root.x = cx;
		root.y = cy;
		root.vx = 0;
		root.vy = 0;
	}

	const domains = active.filter((n) => n.level === 'domain');
	if (domains.length) {
		const rootR = root ? effectiveNodeRadius(root) : 58;
		const maxDomR = d3.max(domains, (d) => effectiveNodeRadius(d)) ?? 46;
		const orbit = rootR + maxDomR + 56;
		domains.forEach((d, i) => {
			const angle = (2 * Math.PI * i) / domains.length - Math.PI / 2;
			d.x = cx + orbit * Math.cos(angle);
			d.y = cy + orbit * Math.sin(angle);
			d.vx = 0;
			d.vy = 0;
		});
	}

	const areas = active.filter((n) => n.level === 'area');
	for (const [parentId, group] of d3.group(areas, (n) => parents.get(n.id) ?? '')) {
		const parent = active.find((n) => n.id === parentId);
		const px = parent?.x ?? cx;
		const py = parent?.y ?? cy;
		const parentR = parent ? effectiveNodeRadius(parent) : 46;
		const maxAreaR = d3.max(group, (d) => effectiveNodeRadius(d)) ?? 38;
		const orbit = parentR + maxAreaR + 38;
		group.forEach((d, i) => {
			const angle = (2 * Math.PI * i) / Math.max(1, group.length) - Math.PI / 4;
			d.x = px + orbit * Math.cos(angle);
			d.y = py + orbit * Math.sin(angle);
			d.vx = 0;
			d.vy = 0;
		});
	}

	const features = active.filter((n) => n.level === 'feature');
	for (const [parentId, group] of d3.group(features, (n) => parents.get(n.id) ?? '')) {
		const parent = active.find((n) => n.id === parentId);
		const px = parent?.x ?? cx;
		const py = parent?.y ?? cy;
		const parentR = parent ? effectiveNodeRadius(parent) : 38;
		const maxFeatR = d3.max(group, (d) => effectiveNodeRadius(d)) ?? 30;
		const orbit = parentR + maxFeatR + 30;
		const spread = Math.min(Math.PI * 1.35, Math.max(Math.PI / 3, (2 * Math.PI) / Math.max(6, group.length)));
		const start = -spread / 2;
		group.forEach((d, i) => {
			const t = group.length <= 1 ? 0.5 : i / (group.length - 1);
			const angle = start + spread * t;
			d.x = px + orbit * Math.cos(angle);
			d.y = py + orbit * Math.sin(angle);
			d.vx = 0;
			d.vy = 0;
		});
	}
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
	const mapTop = mapPage.getBoundingClientRect().top;
	/* Use the map's position in the document, not only the header—avoids over-tall map on /platform-spec/ (tabs + copy above the canvas). */
	const topBound = Math.max(topPx, mapTop);
	const footerRect = footer?.getBoundingClientRect();
	const footerVisible =
		Boolean(footerRect) &&
		footerRect.height > 0 &&
		window.getComputedStyle(footer as HTMLElement).display !== 'none' &&
		window.getComputedStyle(footer as HTMLElement).visibility !== 'hidden';
	const footerTop = footerVisible && footerRect ? footerRect.top : viewH;
	const bottomBound = Math.max(topBound, Math.min(viewH, footerTop));
	const available = Math.max(280, bottomBound - topBound);
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
	const mapPageEl = document.querySelector<HTMLElement>('.platform-spec-map-page');
	if (typeof ResizeObserver !== 'undefined' && mapPageEl) {
		const ro = new ResizeObserver(() => syncMapChromeInsets());
		ro.observe(mapPageEl);
	}

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

	let width = Math.max(900, mountEl.clientWidth || 900);
	let height = Math.max(620, mountEl.clientHeight || 620);
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

	const simNodes: SimNode[] = graph.nodes.map((node) => ({
		...node,
		x: width / 2,
		y: height / 2,
		vx: 0,
		vy: 0,
	}));
	const simNodeById = new Map(simNodes.map((n) => [n.id, n]));
	const simEdges: SimEdge[] = graph.edges.map((edge) => ({
		...edge,
		source: edge.from,
		target: edge.to,
	}));

	function edgeEndpointId(end: string | SimNode): string {
		return typeof end === 'string' ? end : end.id;
	}

	function edgeVisible(edge: SimEdge): boolean {
		return Boolean(visibility.get(edgeEndpointId(edge.source)) && visibility.get(edgeEndpointId(edge.target)));
	}

	const linkForce = d3
		.forceLink<SimNode, SimEdge>()
		.id((d) => d.id)
		.distance((e) => {
			const source = simNodeById.get(edgeEndpointId(e.source));
			const target = simNodeById.get(edgeEndpointId(e.target));
			if (!source || !target) return 120;
			return linkDistanceBetween(source, target);
		})
		.strength(0.42);

	const simulation = d3
		.forceSimulation<SimNode>([])
		.force('charge', d3.forceManyBody<SimNode>().strength(-300))
		.force('link', linkForce)
		.force('center', d3.forceCenter(width / 2, height / 2).strength(0.04))
		.force('collide', d3.forceCollide<SimNode>((n) => effectiveNodeRadius(n) + 14).iterations(2));

	let initialFitDone = false;
	let refitOnEnd = false;

	function refreshCanvasSize(): boolean {
		const nextW = Math.max(320, mountEl.clientWidth || 900);
		const nextH = Math.max(280, mountEl.clientHeight || 620);
		if (nextW === width && nextH === height) return false;
		width = nextW;
		height = nextH;
		svg.attr('viewBox', `0 0 ${width} ${height}`);
		(simulation.force('center') as d3.ForceCenter<SimNode>).x(width / 2).y(height / 2);
		return true;
	}

	function isHubAndDomainsOnly(active: SimNode[]): boolean {
		return active.length > 0 && active.every((n) => n.level === 'root' || n.level === 'domain');
	}

	function buildActiveLinks(active: SimNode[]): SimEdge[] {
		const visibleIds = new Set(active.map((n) => n.id));
		const links: SimEdge[] = [];
		for (const edge of simEdges) {
			const from = edge.from;
			const to = edge.to;
			if (!visibleIds.has(from) || !visibleIds.has(to)) continue;
			const source = simNodeById.get(from);
			const target = simNodeById.get(to);
			if (!source || !target) continue;
			links.push({ ...edge, source, target });
		}
		return links;
	}

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
		.data(simEdges, (d) => d.id)
		.join('line')
		.attr('class', 'platform-spec-map-svg__edge')
		.attr('fill', 'none');

	const edgeLabelSel = edgeLabelLayer
		.selectAll<SVGTextElement, SimEdge>('text')
		.data(
			simEdges.filter((e) => e.label),
			(d) => d.id,
		)
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

	function renderGraphPositions() {
		nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
		edgeSel
			.attr('display', (d) => (edgeVisible(d) ? null : 'none'))
			.attr('x1', (d) => simNodeById.get(edgeEndpointId(d.source))?.x ?? 0)
			.attr('y1', (d) => simNodeById.get(edgeEndpointId(d.source))?.y ?? 0)
			.attr('x2', (d) => simNodeById.get(edgeEndpointId(d.target))?.x ?? 0)
			.attr('y2', (d) => simNodeById.get(edgeEndpointId(d.target))?.y ?? 0);
		edgeLabelSel
			.attr('display', (d) => (edgeVisible(d) ? null : 'none'))
			.attr('x', (d) => {
				const s = simNodeById.get(edgeEndpointId(d.source));
				const t = simNodeById.get(edgeEndpointId(d.target));
				return s && t ? (s.x + t.x) / 2 : 0;
			})
			.attr('y', (d) => {
				const s = simNodeById.get(edgeEndpointId(d.source));
				const t = simNodeById.get(edgeEndpointId(d.target));
				return s && t ? (s.y + t.y) / 2 - 6 : 0;
			});
	}

	function queueFitAfterLayout() {
		requestAnimationFrame(() => {
			if (refitOnEnd) {
				refitOnEnd = false;
				fitVisible();
				return;
			}
			if (!initialFitDone) {
				initialFitDone = true;
				fitVisible();
			}
		});
	}

	function syncSimulationToVisibility(seedLayout = true) {
		refreshCanvasSize();
		const activeNodes = simNodes.filter((n) => visibility.get(n.id));
		if (!activeNodes.length) return;

		for (const n of simNodes) {
			n.fx = null;
			n.fy = null;
		}

		if (seedLayout) {
			seedVisibleLayout(activeNodes, width / 2, height / 2, parentMap);
		}

		const links = buildActiveLinks(activeNodes);
		renderGraphPositions();

		if (isHubAndDomainsOnly(activeNodes)) {
			simulation.stop();
			queueFitAfterLayout();
			return;
		}

		linkForce.links(links);
		simulation.nodes(activeNodes);
		simulation.alpha(0.65).restart();
	}

	function applyVisibility(requestRefit = false, seedLayout = true) {
		nodeSel.attr('display', (d) => (visibility.get(d.id) ? null : 'none'));
		syncSimulationToVisibility(seedLayout);
		if (requestRefit) refitOnEnd = true;
	}

	function fitVisible(duration = 320) {
		const visibleNodes = simNodes.filter((n) => visibility.get(n.id));
		if (!visibleNodes.length) return;
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		for (const n of visibleNodes) {
			const padR = effectiveNodeRadius(n) + 12;
			minX = Math.min(minX, n.x - padR);
			maxX = Math.max(maxX, n.x + padR);
			minY = Math.min(minY, n.y - padR);
			maxY = Math.max(maxY, n.y + padR);
		}
		if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return;
		const pad = 56;
		const boxW = Math.max(10, maxX - minX + pad * 2);
		const boxH = Math.max(10, maxY - minY + pad * 2);
		const scale = Math.max(0.35, Math.min(2.85, Math.min(width / boxW, height / boxH)));
		const tx = width / 2 - ((minX + maxX) / 2) * scale;
		const ty = height / 2 - ((minY + maxY) / 2) * scale;
		svg.transition().duration(duration).call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
	}

	function collapseAllBelowDomains() {
		for (const node of graph.nodes) {
			if (node.level === 'area' || node.level === 'feature') visibility.set(node.id, false);
		}
		applyVisibility(true);
	}

	function showAllNodes() {
		for (const node of graph.nodes) visibility.set(node.id, true);
		applyVisibility(true);
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
		applyVisibility(true);
	}

	function toggleFeaturesForArea(areaPath: string) {
		const features = graph.nodes.filter((n) => n.level === 'feature' && n.areaPath === areaPath);
		if (!features.length) return;
		const nextState = !visibility.get(features[0].id);
		for (const feat of features) visibility.set(feat.id, nextState);
		applyVisibility(true);
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
		applyVisibility(false, true);
		const target = simNodes.find((n) => n.id === node.id);
		if (target) {
			const baseScale =
				node.level === 'root' ? 1.38 : node.level === 'domain' ? 1.82 : node.level === 'area' ? 2.12 : 2.52;
			const r = effectiveNodeRadius(node);
			const radiusBoost = Math.min(1.42, 56 / Math.max(26, r));
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

	simulation.on('tick', renderGraphPositions);
	simulation.on('end', () => {
		if (refitOnEnd) {
			refitOnEnd = false;
			fitVisible();
			return;
		}
		if (!initialFitDone) {
			initialFitDone = true;
			fitVisible();
		}
	});

	function activateMapLayout() {
		requestAnimationFrame(() => {
			refreshCanvasSize();
			syncMapChromeInsets();
			initialFitDone = false;
			refitOnEnd = true;
			applyVisibility(true, true);
		});
	}

	const mapPanel = mountEl.closest<HTMLElement>('[data-tab-panel="map"]');
	const mapInitiallyVisible = !mapPanel?.hidden;

	if (mapInitiallyVisible) {
		activateMapLayout();
	} else {
		window.addEventListener('platform-spec-map-activate', activateMapLayout);
	}

	if (typeof ResizeObserver !== 'undefined') {
		const graphRo = new ResizeObserver(() => {
			if (mapPanel?.hidden) return;
			if (!refreshCanvasSize()) return;
			refitOnEnd = true;
			syncSimulationToVisibility(false);
		});
		graphRo.observe(mountEl);
	}
}

mountPlatformSpecGraph();
