const NODE_REGEX =
	/^(Person|System|Container|Component)\s*\(\s*([A-Za-z0-9_\-]+)\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?(?:\s*,\s*"([^"]*)")?\s*\)\s*$/;
const REL_REGEX =
	/^(Rel|Rel_D|Rel_U|Rel_L|Rel_R)\s*\(\s*([A-Za-z0-9_\-]+)\s*,\s*([A-Za-z0-9_\-]+)\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?(?:\s*,\s*"([^"]*)")?\s*\)\s*$/;
const BOUNDARY_REGEX =
	/^(System_Boundary|Container_Boundary|Boundary)\s*\(\s*([A-Za-z0-9_\-]+)\s*,\s*"([^"]+)"\s*\)\s*\{\s*$/;

function sanitizeId(value) {
	return String(value)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function lineLabel(raw) {
	return raw.replace(/\s+/g, ' ').trim();
}

function stableHash(input) {
	let hash = 2166136261;
	for (let i = 0; i < input.length; i += 1) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(36);
}

export function parseMermaidC4ToGraph(source, options = {}) {
	const lines = String(source ?? '')
		.replace(/\r\n?/g, '\n')
		.split('\n');
	const nodes = [];
	const edges = [];
	const groups = [];
	const groupById = new Map();
	const nodeById = new Map();
	const boundaryStack = [];
	const diagnostics = [];
	const includeHidden = Boolean(options.includeHiddenDiagnostics);

	const ensureGroup = (groupId, label) => {
		if (!groupById.has(groupId)) {
			const group = { id: groupId, label };
			groupById.set(groupId, group);
			groups.push(group);
		}
		return groupById.get(groupId);
	};

	for (let index = 0; index < lines.length; index += 1) {
		const lineNo = index + 1;
		const rawLine = lines[index];
		const trimmed = rawLine.trim();
		if (!trimmed || trimmed.startsWith('%%')) continue;
		if (
			trimmed === 'C4Context' ||
			trimmed === 'C4Container' ||
			trimmed === 'C4Component' ||
			trimmed === 'C4Dynamic'
		) {
			continue;
		}

		if (trimmed === '}') {
			boundaryStack.pop();
			continue;
		}

		const boundaryMatch = trimmed.match(BOUNDARY_REGEX);
		if (boundaryMatch) {
			const boundaryId = sanitizeId(boundaryMatch[2]) || `group-${lineNo}`;
			const boundaryLabel = lineLabel(boundaryMatch[3]) || boundaryId;
			ensureGroup(boundaryId, boundaryLabel);
			boundaryStack.push(boundaryId);
			continue;
		}

		const nodeMatch = trimmed.match(NODE_REGEX);
		if (nodeMatch) {
			const [, kind, rawId, rawLabel, tech, desc] = nodeMatch;
			const id = sanitizeId(rawId);
			if (!id) {
				diagnostics.push(`Line ${lineNo}: invalid node id in "${trimmed}"`);
				continue;
			}
			if (nodeById.has(id)) {
				diagnostics.push(`Line ${lineNo}: duplicate node id "${id}"`);
				continue;
			}
			const group = boundaryStack.length ? boundaryStack[boundaryStack.length - 1] : undefined;
			const meta = {};
			if (tech) meta.technology = tech;
			meta.kind = kind;
			const node = {
				id,
				label: lineLabel(rawLabel) || id,
				group,
				description: desc && desc.trim() ? desc.trim() : undefined,
				tags: [kind.toLowerCase()],
				meta,
			};
			nodes.push(node);
			nodeById.set(id, node);
			continue;
		}

		const relMatch = trimmed.match(REL_REGEX);
		if (relMatch) {
			const [, relKind, rawFrom, rawTo, rawLabel, rawTech, rawDesc] = relMatch;
			const from = sanitizeId(rawFrom);
			const to = sanitizeId(rawTo);
			const edge = {
				id: `edge-${edges.length + 1}`,
				from,
				to,
				label: lineLabel(rawLabel),
				description: [rawTech, rawDesc].filter(Boolean).join(' - ') || undefined,
				hidden: includeHidden ? relKind !== 'Rel' : undefined,
			};
			edges.push(edge);
			continue;
		}

		diagnostics.push(`Line ${lineNo}: unsupported C4 statement "${trimmed}"`);
	}

	for (const edge of edges) {
		if (!nodeById.has(edge.from) || !nodeById.has(edge.to)) {
			diagnostics.push(
				`Edge "${edge.from}" -> "${edge.to}" references unknown node(s); keep only declared ids.`,
			);
		}
	}

	const graph = {
		title: options.title ?? 'Architecture graph',
		description: options.description,
		groups,
		nodes,
		edges,
	};
	return { graph, diagnostics, hash: stableHash(source) };
}
