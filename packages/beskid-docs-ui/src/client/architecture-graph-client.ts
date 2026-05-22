import dagre from '@dagrejs/dagre';

type GraphNode = {
	id: string;
	label: string;
	group?: string;
	description?: string;
	href?: string;
	tags?: string[];
	meta?: Record<string, string>;
	hidden?: boolean;
};

type GraphEdge = {
	id?: string;
	from: string;
	to: string;
	label?: string;
	description?: string;
	hidden?: boolean;
};

type GraphGroup = {
	id: string;
	label: string;
	color?: string;
	description?: string;
};

type GraphPayload = {
	title?: string;
	description?: string;
	nodes: GraphNode[];
	edges: GraphEdge[];
	groups?: GraphGroup[];
};

type Point = { x: number; y: number };

type LayoutResult = {
	width: number;
	height: number;
	nodes: Map<string, { x: number; y: number; width: number; height: number }>;
	edges: { from: string; to: string; points: Point[]; label?: string }[];
};

const GROUP_COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#4ade80', '#22d3ee', '#fb7185'];
const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;

function readCssColor(name: string, fallback: string): string {
	const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return v || fallback;
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max - 1)}…`;
}

function parseGraphPayload(graphId: string): GraphPayload | null {
	const el = document.getElementById(`${graphId}-data`);
	if (!el?.textContent?.trim()) return null;
	try {
		return JSON.parse(el.textContent) as GraphPayload;
	} catch {
		return null;
	}
}

function layoutArchitectureGraph(
	nodes: GraphNode[],
	edges: GraphEdge[],
): LayoutResult | null {
	const visibleNodes = nodes.filter((n) => !n.hidden);
	if (!visibleNodes.length) return null;

	const g = new dagre.graphlib.Graph();
	g.setGraph({
		rankdir: 'TB',
		nodesep: 52,
		ranksep: 80,
		edgesep: 24,
		marginx: 32,
		marginy: 32,
	});
	g.setDefaultEdgeLabel(() => ({}));

	for (const node of visibleNodes) {
		g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
	}

	for (const edge of edges) {
		if (edge.hidden) continue;
		if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
			g.setEdge(edge.from, edge.to, { label: edge.label });
		}
	}

	dagre.layout(g);

	const layoutNodes = new Map<string, { x: number; y: number; width: number; height: number }>();
	let maxX = 0;
	let maxY = 0;

	for (const id of g.nodes()) {
		const n = g.node(id);
		if (!n) continue;
		const x = n.x - n.width / 2;
		const y = n.y - n.height / 2;
		layoutNodes.set(id, { x, y, width: n.width, height: n.height });
		maxX = Math.max(maxX, x + n.width);
		maxY = Math.max(maxY, y + n.height);
	}

	const layoutEdges: LayoutResult['edges'] = [];
	for (const edge of g.edges()) {
		const data = g.edge(edge);
		const points = (data?.points ?? []) as Point[];
		if (points.length < 2) continue;
		layoutEdges.push({
			from: edge.v,
			to: edge.w,
			points,
			label: typeof data?.label === 'string' ? data.label : undefined,
		});
	}

	return {
		width: Math.ceil(maxX + 32),
		height: Math.ceil(maxY + 32),
		nodes: layoutNodes,
		edges: layoutEdges,
	};
}

function pointsToPath(points: Point[]): string {
	return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

function edgeMidpoint(points: Point[]): Point {
	const mid = Math.floor(points.length / 2);
	return points[mid] ?? points[points.length - 1];
}

function renderArchitectureGraph(
	canvas: HTMLElement,
	graphId: string,
	graph: GraphPayload,
	groupById: Map<string, GraphGroup & { color: string }>,
): void {
	const layout = layoutArchitectureGraph(graph.nodes, graph.edges);
	if (!layout) return;

	const lineColor = readCssColor('--architecture-graph-line', '#7ed6ff');
	const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

	canvas.innerHTML = '';
	canvas.classList.add('architecture-graph-shell__diagram-host');

	const diagram = document.createElement('div');
	diagram.className = 'architecture-graph-shell__diagram';
	diagram.style.width = `${layout.width}px`;
	diagram.style.height = `${layout.height}px`;

	const svgNs = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNs, 'svg');
	svg.setAttribute('class', 'architecture-graph-shell__edges');
	svg.setAttribute('width', String(layout.width));
	svg.setAttribute('height', String(layout.height));
	svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
	svg.setAttribute('aria-hidden', 'true');

	const defs = document.createElementNS(svgNs, 'defs');
	const marker = document.createElementNS(svgNs, 'marker');
	marker.setAttribute('id', `arch-arrow-${graphId}`);
	marker.setAttribute('viewBox', '0 0 10 10');
	marker.setAttribute('refX', '9');
	marker.setAttribute('refY', '5');
	marker.setAttribute('markerWidth', '7');
	marker.setAttribute('markerHeight', '7');
	marker.setAttribute('orient', 'auto-start-reverse');
	const arrowPath = document.createElementNS(svgNs, 'path');
	arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
	arrowPath.setAttribute('fill', lineColor);
	marker.appendChild(arrowPath);
	defs.appendChild(marker);
	svg.appendChild(defs);

	const edgeGroup = document.createElementNS(svgNs, 'g');
	edgeGroup.setAttribute('class', 'architecture-graph-shell__edge-lines');

	for (const edge of layout.edges) {
		const path = document.createElementNS(svgNs, 'path');
		path.setAttribute('d', pointsToPath(edge.points));
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', lineColor);
		path.setAttribute('stroke-width', '2.5');
		path.setAttribute('marker-end', `url(#arch-arrow-${graphId})`);
		if (edge.label) {
			path.setAttribute('data-edge-label', edge.label);
		}
		edgeGroup.appendChild(path);

		if (edge.label) {
			const mid = edgeMidpoint(edge.points);
			const label = document.createElementNS(svgNs, 'text');
			label.setAttribute('x', String(mid.x));
			label.setAttribute('y', String(mid.y - 6));
			label.setAttribute('text-anchor', 'middle');
			label.setAttribute('class', 'architecture-graph-shell__edge-label');
			label.textContent = edge.label;
			edgeGroup.appendChild(label);
		}
	}
	svg.appendChild(edgeGroup);

	const nodesLayer = document.createElement('div');
	nodesLayer.className = 'architecture-graph-shell__nodes';

	for (const [id, pos] of layout.nodes) {
		const node = nodeById.get(id);
		if (!node) continue;

		const group = node.group ? groupById.get(node.group) : undefined;
		const groupLabel = group?.label ?? '';
		const body = node.description?.trim() ?? '';
		const subtitle =
			groupLabel && body ? `${groupLabel} · ${truncate(body, 72)}` : groupLabel || truncate(body, 80);
		const accent = group?.color ?? '#64748b';

		const card = document.createElement(node.href ? 'a' : 'div');
		card.className = 'architecture-graph-node';
		if (node.href) {
			(card as HTMLAnchorElement).href = node.href;
		}
		card.style.left = `${pos.x}px`;
		card.style.top = `${pos.y}px`;
		card.style.width = `${pos.width}px`;
		card.style.height = `${pos.height}px`;
		card.style.setProperty('--arch-node-accent', accent);

		const header = document.createElement('div');
		header.className = 'architecture-graph-node__bar';

		const title = document.createElement('div');
		title.className = 'architecture-graph-node__title';
		title.textContent = node.label;

		const desc = document.createElement('div');
		desc.className = 'architecture-graph-node__desc';
		desc.textContent = subtitle;

		card.append(header, title, desc);
		nodesLayer.appendChild(card);
	}

	diagram.append(svg, nodesLayer);
	canvas.appendChild(diagram);
	canvas.style.minHeight = `${Math.max(layout.height + 16, 448)}px`;
}

function isArchitectureGraphVisible(root: HTMLElement): boolean {
	const panel = root.closest<HTMLElement>('[role="tabpanel"]');
	if (!panel) return true;
	return !panel.hidden;
}

const activeMounts = new WeakSet<HTMLElement>();

function mountArchitectureGraph(root: HTMLElement): void {
	if (activeMounts.has(root)) return;

	const graphId = root.dataset.graphId;
	if (!graphId) return;
	const graph = parseGraphPayload(graphId);
	if (!graph?.nodes?.length) return;

	const canvas = root.querySelector<HTMLElement>('[data-architecture-graph-canvas]');
	if (!canvas) return;
	const groups = graph.groups ?? [];
	const groupById = new Map(
		groups.map((group, index) => [group.id, { ...group, color: group.color ?? GROUP_COLORS[index % GROUP_COLORS.length] }]),
	);

	let mounted = false;

	const render = () => {
		if (!isArchitectureGraphVisible(root)) return;
		renderArchitectureGraph(canvas, graphId, graph, groupById);
		mounted = true;
	};

	const scheduleRender = () => requestAnimationFrame(render);

	const panel = root.closest<HTMLElement>('[role="tabpanel"]');
	const cleanups: (() => void)[] = [];

	if (panel) {
		const panelObserver = new MutationObserver(scheduleRender);
		panelObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
		cleanups.push(() => panelObserver.disconnect());

		const tabs = panel.closest('starlight-tabs');
		if (tabs) {
			tabs.addEventListener('click', scheduleRender);
			cleanups.push(() => tabs.removeEventListener('click', scheduleRender));
		}
	}

	const intersectionObserver = new IntersectionObserver(
		(entries) => {
			if (entries.some((e) => e.isIntersecting)) scheduleRender();
		},
		{ threshold: 0.05 },
	);
	intersectionObserver.observe(canvas);
	cleanups.push(() => intersectionObserver.disconnect());

	const resizeObserver = new ResizeObserver(() => {
		if (mounted && isArchitectureGraphVisible(root)) scheduleRender();
		else if (!mounted) scheduleRender();
	});
	resizeObserver.observe(canvas);
	cleanups.push(() => resizeObserver.disconnect());

	const unwatch = () => {
		for (const fn of cleanups) fn();
	};
	activeMounts.set(root, unwatch);

	scheduleRender();

	root.addEventListener(
		'astro:before-swap',
		() => {
			unwatch();
			activeMounts.delete(root);
			canvas.innerHTML = '';
		},
		{ once: true },
	);
}

function initArchitectureGraphs(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>('[data-architecture-graph-root]').forEach((el) => mountArchitectureGraph(el));
}

initArchitectureGraphs();
document.addEventListener('astro:after-swap', () => initArchitectureGraphs());
