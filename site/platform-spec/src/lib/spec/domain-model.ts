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
	level: "root" | "domain" | "area" | "feature" | "article" | "decision";
	children?: OpenSpecNavNode[];
}

export interface FeatureNode {
	documentKey: string;
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
	documentKey: string;
	area: string;
	title: string;
	slug: string;
	href: string;
	features: FeatureNode[];
}

export interface DomainNode {
	documentKey: string;
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

export function buildDomainModel(
	catalog: OpenSpecCatalog,
): DomainAreaFeatureModel {
	const featureDocuments = catalog.documents.filter(
		(document) => document.kind === "feature",
	);
	const areaDocuments = catalog.documents.filter(
		(document) => document.kind === "taxonomy-area",
	);
	const domainNodes: DomainNode[] = catalog.documents
		.filter((document) => document.kind === "taxonomy-domain")
		.map((domainDocument) => {
			const areaNodes: AreaNode[] = areaDocuments
				.filter(
					(areaDocument) =>
						areaDocument.parentCapability === domainDocument.capability,
				)
				.map((areaDocument) => {
					const features: FeatureNode[] = featureDocuments
						.filter(
							(featureDocument) =>
								featureDocument.parentCapability === areaDocument.capability,
						)
						.map((featureDocument) => ({
							documentKey: featureDocument.key,
							capability: featureDocument.capability,
							id: featureDocument.id,
							slug: featureDocument.slug,
							href: featureDocument.href,
							title: featureDocument.title,
							specLevel: featureDocument.specLevel,
							status: featureDocument.status,
							domain: featureDocument.domain,
							area: featureDocument.area,
							feature: featureDocument.feature,
							requirementCount: featureDocument.requirements.length,
						}))
						.sort((left, right) => left.title.localeCompare(right.title));
					return {
						documentKey: areaDocument.key,
						area: areaDocument.area,
						title: areaDocument.title,
						slug: areaDocument.slug,
						href: areaDocument.href,
						features,
					};
				})
				.sort((left, right) => left.title.localeCompare(right.title));
			return {
				documentKey: domainDocument.key,
				domain: domainDocument.domain,
				title: domainDocument.title,
				slug: domainDocument.slug,
				href: domainDocument.href,
				areas: areaNodes,
			};
		})
		.sort((left, right) => left.title.localeCompare(right.title));
	const areaCount = domainNodes.reduce(
		(count, domain) => count + domain.areas.length,
		0,
	);
	const featureCount = domainNodes.reduce(
		(count, domain) =>
			count +
			domain.areas.reduce(
				(areaTotal, area) => areaTotal + area.features.length,
				0,
			),
		0,
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
	const childDocuments = new Map<string, OpenSpecCatalogEntry[]>();
	for (const document of catalog.documents.filter(
		(document) => document.kind === "article" || document.kind === "decision",
	)) {
		const children = childDocuments.get(document.parentCapability) ?? [];
		children.push(document);
		childDocuments.set(document.parentCapability, children);
	}
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
					children: (childDocuments.get(feature.capability) ?? [])
						.sort((left, right) => left.title.localeCompare(right.title))
						.map((document) => ({
							slug: document.slug,
							href: document.href,
							title: document.title,
							level:
								document.kind === "article" ? "article" : "decision",
						})),
				})),
			})),
		})),
	};
}
