// Domain -> area -> feature model derived natively from the OpenSpec catalog.
// The taxonomy is encoded in each capability id (`domain--area--feature`); this
// module turns the flat catalog into the hierarchical shape used by the nav
// rail, the static seed, and the Memgraph graph. Pure module (no server-only).

import type {
	OpenSpecCatalog,
	OpenSpecCatalogEntry,
} from "#/lib/spec/catalog";

export interface OpenSpecNavNode {
	slug: string;
	href: string;
	title: string;
	level: "root" | "domain" | "area" | "feature" | "article";
	children?: OpenSpecNavNode[];
}

export interface FeatureNode {
	capability: string;
	id: string;
	slug: string;
	href: string;
	title: string;
	specLevel: string;
	status: string | null;
	domain: string;
	area: string;
	feature: string;
	requirementCount: number;
}

export interface AreaNode {
	area: string;
	title: string;
	slug: string;
	href: string;
	features: FeatureNode[];
}

export interface DomainNode {
	domain: string;
	title: string;
	slug: string;
	href: string;
	areas: AreaNode[];
}

export interface DomainAreaFeatureModel {
	revision: string;
	domains: DomainNode[];
	domainCount: number;
	areaCount: number;
	featureCount: number;
}

function titleCase(value: string): string {
	return value
		.replace(/-/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function domainOf(entry: OpenSpecCatalogEntry): string {
	return entry.domain ?? entry.capability.split("--")[0] ?? "standard";
}

function areaOf(entry: OpenSpecCatalogEntry): string {
	return entry.area ?? entry.capability.split("--")[1] ?? "general";
}

function featureOf(entry: OpenSpecCatalogEntry): string {
	return entry.feature ?? entry.capability.split("--").at(-1) ?? entry.capability;
}

export function buildDomainModel(
	catalog: OpenSpecCatalog,
): DomainAreaFeatureModel {
	const domains = new Map<string, Map<string, FeatureNode[]>>();

	for (const entry of catalog.entries) {
		const domain = domainOf(entry);
		const area = areaOf(entry);
		const areas = domains.get(domain) ?? new Map<string, FeatureNode[]>();
		const features = areas.get(area) ?? [];
		features.push({
			capability: entry.capability,
			id: entry.id,
			slug: entry.slug,
			href: entry.href,
			title: entry.title,
			specLevel: entry.specLevel,
			status: entry.status,
			domain,
			area,
			feature: featureOf(entry),
			requirementCount: entry.requirements.length,
		});
		areas.set(area, features);
		domains.set(domain, areas);
	}

	let areaCount = 0;
	let featureCount = 0;
	const domainNodes: DomainNode[] = [...domains.entries()].map(
		([domain, areas]) => {
			const areaNodes: AreaNode[] = [...areas.entries()].map(
				([area, features]) => {
					areaCount += 1;
					featureCount += features.length;
					return {
						area,
						title: titleCase(area),
						slug: `platform-spec/domain/${domain}/${area}`,
						href: features[0]?.href ?? "/platform-spec/",
						features,
					};
				},
			);
			return {
				domain,
				title: titleCase(domain),
				slug: `platform-spec/domain/${domain}`,
				href: areaNodes[0]?.features[0]?.href ?? "/platform-spec/",
				areas: areaNodes,
			};
		},
	);

	return {
		revision: catalog.revision,
		domains: domainNodes,
		domainCount: domainNodes.length,
		areaCount,
		featureCount,
	};
}

export function buildNavTree(catalog: OpenSpecCatalog): OpenSpecNavNode {
	const model = buildDomainModel(catalog);
	return {
		slug: "platform-spec",
		href: "/platform-spec/",
		title: "Platform specification",
		level: "root",
		children: model.domains.map((domain) => ({
			slug: domain.slug,
			href: domain.href,
			title: domain.title,
			level: "domain",
			children: domain.areas.map((area) => ({
				slug: area.slug,
				href: area.href,
				title: area.title,
				level: "area",
				children: area.features.map((feature) => ({
					slug: feature.slug,
					href: feature.href,
					title: feature.title,
					level: "feature",
				})),
			})),
		})),
	};
}
