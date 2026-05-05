import * as d3 from 'd3';

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

const GROUP_COLORS = ['#60a5fa', '#4ade80', '#f59e0b', '#a78bfa', '#22d3ee', '#fb7185'];

function parseGraphPayload(graphId: string): GraphPayload | null {
	const el = document.getElementById(`${graphId}-data`);
	if (!el?.textContent?.trim()) return null;
	try {
		return JSON.parse(el.textContent) as GraphPayload;
	} catch {
		return null;
	}
}

function normalizeEdges(edges: GraphEdge[]): GraphEdge[] {
	return edges.map((edge, index) => ({ ...edge, id: edge.id ?? `edge:${index}` }));
}

function renderGroupFilters(
	groupsWrap: HTMLElement,
	groups: GraphGroup[],
	toggleGroup: (groupId: string, checked: boolean) => void,
) {
	groupsWrap.innerHTML = '';
	for (const group of groups) {
		const id = `group-${group.id}`;
		const label = document.createElement('label');
		label.className = 'architecture-graph-shell__group-item';
		label.setAttribute('for', id);
		label.innerHTML = `<input id="${id}" type="checkbox" checked /><span>${group.label}</span>`;
		const input = label.querySelector('input');
		if (input) {
			input.addEventListener('change', () => toggleGroup(group.id, input.checked));
		}
		groupsWrap.appendChild(label);
	}
}

function renderLegend(legendWrap: HTMLElement, groups: GraphGroup[]) {
	if (!groups.length) {
		legendWrap.hidden = true;
		return;
	}
	legendWrap.hidden = false;
	legendWrap.innerHTML = groups
		.map((group) => {
			const color = group.color ?? '#94a3b8';
			return `<span class="architecture-graph-shell__legend-item"><i style="background:${color};border-color:${color}"></i>${group.label}</span>`;
		})
		.join('');
}

function mountArchitectureGraph(root: HTMLElement): void {
	const graphId = root.dataset.graphId;
	if (!graphId) return;
	const graph = parseGraphPayload(graphId);
	if (!graph) return;

	const canvas = root.querySelector<HTMLElement>('[data-architecture-graph-canvas]');
	const groupsWrap = root.querySelector<HTMLElement>('[data-architecture-graph-groups]');
	const legendWrap = root.querySelector<HTMLElement>('[data-architecture-graph-legend]');
	const fitBtn = root.querySelector<HTMLButtonElement>('[data-architecture-graph-fit]');
	const collapseBtn = root.querySelector<HTMLButtonElement>('[data-architecture-graph-collapse]');
	const expandBtn = root.querySelector<HTMLButtonElement>('[data-architecture-graph-expand]');
	const searchInput = root.querySelector<HTMLInputElement>('[data-architecture-graph-search]');
	const panelTitle = root.querySelector<HTMLElement>('[data-architecture-graph-panel-title]');
	const panelMeta = root.querySelector<HTMLElement>('[data-architecture-graph-panel-meta]');
	const panelDesc = root.querySelector<HTMLElement>('[data-architecture-graph-panel-desc]');
	const panelKv = root.querySelector<HTMLElement>('[data-architecture-graph-panel-kv]');
	const panelRels = root.querySelector<HTMLElement>('[data-architecture-graph-panel-rels]');
	const panelLink = root.querySelector<HTMLAnchorElement>('[data-architecture-graph-panel-link]');
	if (!canvas || !groupsWrap || !legendWrap || !searchInput || !panelTitle || !panelMeta || !panelDesc || !panelKv || !panelRels || !panelLink) {
		return;
	}

	const groups = graph.groups ?? [];
	const groupById = new Map(groups.map((group, index) => [group.id, { ...group, color: group.color ?? GROUP_COLORS[index % GROUP_COLORS.length] }]));
	const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
	const edges = normalizeEdges(graph.edges);
	const nodeVisibility = new Map(graph.nodes.map((node) => [node.id, !Boolean(node.hidden)]));

	canvas.innerHTML = '';
	const width = Math.max(620, canvas.clientWidth || 620);
	const height = Math.max(420, canvas.clientHeight || 420);

	const svg = d3
		.select(canvas)
		.append('svg')
		.attr('viewBox', `0 0 ${width} ${height}`)
		.attr('class', 'architecture-graph-shell__svg')
		.attr('role', 'img');

	const zoomLayer = svg.append('g').attr('class', 'architecture-graph-shell__zoom-layer');
	const edgesLayer = zoomLayer.append('g').attr('class', 'architecture-graph-shell__edges');
	const nodesLayer = zoomLayer.append('g').attr('class', 'architecture-graph-shell__nodes');
	const labelsLayer = zoomLayer.append('g').attr('class', 'architecture-graph-shell__edge-labels');

	const arrowId = `arch-arrow-${Math.random().toString(36).slice(2, 10)}`;
	svg
		.append('defs')
		.append('marker')
		.attr('id', arrowId)
		.attr('viewBox', '0 -5 10 10')
		.attr('refX', 18)
		.attr('refY', 0)
		.attr('markerWidth', 7)
		.attr('markerHeight', 7)
		.attr('orient', 'auto')
		.append('path')
		.attr('d', 'M0,-5L10,0L0,5')
		.attr('fill', '#64748b');

	type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number; fx?: number | null; fy?: number | null };
	type SimEdge = GraphEdge & { source: string | SimNode; target: string | SimNode };

	const simNodes: SimNode[] = graph.nodes.map((node, idx) => ({
		...node,
		x: width / 2 + (idx % 7) * 24,
		y: height / 2 + Math.floor(idx / 7) * 18,
		vx: 0,
		vy: 0,
	}));
	const simEdges: SimEdge[] = edges.map((edge) => ({ ...edge, source: edge.from, target: edge.to }));

	const simulation = d3
		.forceSimulation<SimNode>(simNodes)
		.force('link', d3.forceLink<SimNode, SimEdge>(simEdges).id((d) => d.id).distance(170).strength(0.24))
		.force('charge', d3.forceManyBody().strength(-360))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collide', d3.forceCollide(34));

	const edgeSelection = edgesLayer
		.selectAll<SVGLineElement, SimEdge>('line')
		.data(simEdges, (d: any) => d.id)
		.join('line')
		.attr('class', 'architecture-graph-shell__edge')
		.attr('marker-end', `url(#${arrowId})`);

	const edgeLabelSelection = labelsLayer
		.selectAll<SVGTextElement, SimEdge>('text')
		.data(simEdges.filter((edge) => edge.label), (d: any) => d.id)
		.join('text')
		.attr('class', 'architecture-graph-shell__edge-label')
		.text((d) => d.label ?? '');

	const nodeSelection = nodesLayer
		.selectAll<SVGGElement, SimNode>('g')
		.data(simNodes, (d: any) => d.id)
		.join('g')
		.attr('class', 'architecture-graph-shell__node');

	nodeSelection
		.append('circle')
		.attr('r', 16)
		.attr('fill', (d) => (d.group ? groupById.get(d.group)?.color ?? '#94a3b8' : '#cbd5e1'))
		.attr('stroke', (d) => (d.group ? groupById.get(d.group)?.color ?? '#64748b' : '#64748b'))
		.attr('stroke-width', 1.8);

	nodeSelection
		.append('text')
		.attr('class', 'architecture-graph-shell__node-label')
		.attr('x', 21)
		.attr('y', 4)
		.text((d) => d.label);

	const drag = d3
		.drag<SVGGElement, SimNode>()
		.on('start', (event, d) => {
			if (!event.active) simulation.alphaTarget(0.24).restart();
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
		});
	nodeSelection.call(drag as any);

	const zoom = d3
		.zoom<SVGSVGElement, unknown>()
		.scaleExtent([0.3, 2.8])
		.on('zoom', (event) => {
			zoomLayer.attr('transform', event.transform.toString());
		});
	svg.call(zoom as any);

	const edgeVisible = (edge: SimEdge): boolean => {
		const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
		const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
		return Boolean(nodeVisibility.get(sourceId) && nodeVisibility.get(targetId));
	};

	const applyVisibility = () => {
		nodeSelection.attr('display', (d) => (nodeVisibility.get(d.id) ? null : 'none'));
		edgeSelection.attr('display', (d) => (edgeVisible(d) ? null : 'none'));
		edgeLabelSelection.attr('display', (d) => (edgeVisible(d) ? null : 'none'));
	};

	const fitVisible = () => {
		const visible = simNodes.filter((node) => nodeVisibility.get(node.id));
		if (!visible.length) return;
		const minX = d3.min(visible, (n) => n.x) ?? 0;
		const maxX = d3.max(visible, (n) => n.x) ?? width;
		const minY = d3.min(visible, (n) => n.y) ?? 0;
		const maxY = d3.max(visible, (n) => n.y) ?? height;
		const pad = 52;
		const boxW = Math.max(1, maxX - minX + pad * 2);
		const boxH = Math.max(1, maxY - minY + pad * 2);
		const scale = Math.max(0.3, Math.min(2.2, Math.min(width / boxW, height / boxH)));
		const tx = width / 2 - ((minX + maxX) / 2) * scale;
		const ty = height / 2 - ((minY + maxY) / 2) * scale;
		svg.transition().duration(280).call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
	};

	const applySearchFilter = (term: string) => {
		const q = term.trim().toLowerCase();
		for (const node of graph.nodes) {
			const hay = `${node.label} ${node.id} ${node.tags?.join(' ') ?? ''} ${node.group ?? ''}`.toLowerCase();
			nodeVisibility.set(node.id, !q || hay.includes(q));
		}
		applyVisibility();
	};

	const groupVisibility = new Map<string, boolean>();
	for (const group of groups) groupVisibility.set(group.id, true);

	const toggleGroup = (groupId: string, checked: boolean) => {
		groupVisibility.set(groupId, checked);
		graph.nodes
			.filter((node) => node.group === groupId)
			.forEach((node) => nodeVisibility.set(node.id, checked));
		applyVisibility();
	};

	const collapseAll = () => {
		for (const group of groups) groupVisibility.set(group.id, false);
		graph.nodes.forEach((node) => nodeVisibility.set(node.id, !node.group));
		applyVisibility();
		root.querySelectorAll<HTMLInputElement>('.architecture-graph-shell__group-item input').forEach((input) => {
			input.checked = false;
		});
	};

	const expandAll = () => {
		for (const group of groups) groupVisibility.set(group.id, true);
		graph.nodes.forEach((node) => nodeVisibility.set(node.id, true));
		applyVisibility();
		root.querySelectorAll<HTMLInputElement>('.architecture-graph-shell__group-item input').forEach((input) => {
			input.checked = true;
		});
	};

	renderGroupFilters(groupsWrap, groups, toggleGroup);
	renderLegend(legendWrap, [...groupById.values()]);

	searchInput.addEventListener('input', () => applySearchFilter(searchInput.value));
	fitBtn?.addEventListener('click', () => fitVisible());
	collapseBtn?.addEventListener('click', () => collapseAll());
	expandBtn?.addEventListener('click', () => expandAll());

	const setPanelNode = (node: GraphNode) => {
		panelTitle.textContent = node.label;
		panelMeta.textContent = `${node.group ? `${node.group} · ` : ''}${node.id}`;
		panelDesc.textContent = node.description ?? '';
		panelKv.innerHTML = '';
		const metaRows = node.meta ?? {};
		Object.entries(metaRows).forEach(([k, v]) => {
			const dt = document.createElement('dt');
			dt.textContent = k;
			const dd = document.createElement('dd');
			dd.textContent = v;
			panelKv.append(dt, dd);
		});

		const rels = edges.filter((edge) => edge.from === node.id || edge.to === node.id);
		panelRels.innerHTML = rels.length
			? rels
					.map((edge) => {
						const isOut = edge.from === node.id;
						const peer = nodeById.get(isOut ? edge.to : edge.from);
						if (!peer) return '';
						const direction = isOut ? '->' : '<-';
						const label = edge.label ? ` (${edge.label})` : '';
						const detail = edge.description ? ` - ${edge.description}` : '';
						return `<li><strong>${direction} ${peer.label}</strong>${label}${detail}</li>`;
					})
					.join('')
			: '<li>No direct relations.</li>';

		if (node.href) {
			panelLink.href = node.href;
			panelLink.hidden = false;
		} else {
			panelLink.hidden = true;
		}
	};

	nodeSelection.on('click', (_, datum) => {
		const node = nodeById.get(datum.id);
		if (!node) return;
		setPanelNode(node);
	});

	nodeSelection.on('dblclick', (_, datum) => {
		const node = nodeById.get(datum.id);
		if (node?.href) window.location.href = node.href;
	});

	simulation.on('tick', () => {
		edgeSelection
			.attr('x1', (d: any) => d.source.x)
			.attr('y1', (d: any) => d.source.y)
			.attr('x2', (d: any) => d.target.x)
			.attr('y2', (d: any) => d.target.y);

		edgeLabelSelection
			.attr('x', (d: any) => (d.source.x + d.target.x) / 2)
			.attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 6);

		nodeSelection.attr('transform', (d) => `translate(${d.x},${d.y})`);
	});

	applyVisibility();
	window.setTimeout(() => fitVisible(), 280);
}

document.querySelectorAll<HTMLElement>('[data-architecture-graph-root]').forEach((root) => mountArchitectureGraph(root));
