export type SpecDocumentIdentity = {
	artifactKind: "domain" | "area" | "feature" | "article" | "decision";
	kind: "taxonomy-domain" | "taxonomy-area" | "feature" | "article" | "decision";
	key: string;
	capability: string;
	canonicalPath: string;
	publicSlug: string;
	href: string;
	parentCapability: string;
	parentSlug: string;
	authority: "normative" | "informative";
	disposition: "provisional-taxonomy" | "normative-standard" | "informative-by-policy";
	layout: "_default" | "feature" | "article" | "adr";
	specLevel: "domain" | "area" | "feature" | "article" | "adr";
	domain: string;
	area: string | null;
	feature: string | null;
	article: string | null;
	decision: string | null;
};

type CapabilityDocumentIdentityInput = { capability: string; specLevel?: string | null };

const segment = "[a-z0-9]+(?:-[a-z0-9]+)*";

function value(input: RegExpMatchArray, index: number): string {
	return input[index];
}

function identity(
	fields: Omit<SpecDocumentIdentity, "href">,
): SpecDocumentIdentity {
	return { ...fields, href: `/${fields.publicSlug}/` };
}

export function resolveCapabilityDocumentIdentity({
	capability,
	specLevel,
}: CapabilityDocumentIdentityInput): SpecDocumentIdentity | null {
	if (["article", "adr", "decision"].includes(specLevel?.trim() ?? "")) {
		throw new Error(`${specLevel} artifacts must use openspec/documents/platform-spec: ${capability}`);
	}
	if (!capability.startsWith("taxonomy--") && capability.split("--").length !== 3) {
		return null;
	}
	return resolveDocumentIdentityFromPath(`openspec/specs/${capability}/spec.md`);
}

export function resolveDocumentIdentityFromPath(canonicalPath: string): SpecDocumentIdentity {
	const normalized = canonicalPath.replaceAll("\\", "/");
	const domain = normalized.match(new RegExp(`^openspec/specs/taxonomy--(${segment})/spec\\.md$`));
	if (domain) {
		const name = value(domain, 1);
		const capability = `taxonomy--${name}`;
		return identity({ artifactKind: "domain", kind: "taxonomy-domain", key: capability, capability, canonicalPath: normalized, publicSlug: `platform-spec/domains/${name}`, parentCapability: "platform-spec", parentSlug: "platform-spec", authority: "normative", disposition: "provisional-taxonomy", layout: "_default", specLevel: "domain", domain: name, area: null, feature: null, article: null, decision: null });
	}
	const area = normalized.match(new RegExp(`^openspec/specs/taxonomy--(${segment})--(${segment})/spec\\.md$`));
	if (area) {
		const domainName = value(area, 1); const areaName = value(area, 2); const capability = `taxonomy--${domainName}--${areaName}`;
		return identity({ artifactKind: "area", kind: "taxonomy-area", key: capability, capability, canonicalPath: normalized, publicSlug: `platform-spec/domains/${domainName}/areas/${areaName}`, parentCapability: `taxonomy--${domainName}`, parentSlug: `platform-spec/domains/${domainName}`, authority: "normative", disposition: "provisional-taxonomy", layout: "_default", specLevel: "area", domain: domainName, area: areaName, feature: null, article: null, decision: null });
	}
	const feature = normalized.match(new RegExp(`^openspec/specs/(${segment})--(${segment})--(${segment})/spec\\.md$`));
	if (feature && value(feature, 1) !== "taxonomy") {
		const domainName = value(feature, 1); const areaName = value(feature, 2); const featureName = value(feature, 3); const capability = `${domainName}--${areaName}--${featureName}`;
		return identity({ artifactKind: "feature", kind: "feature", key: capability, capability, canonicalPath: normalized, publicSlug: `platform-spec/capabilities/${capability}`, parentCapability: `taxonomy--${domainName}--${areaName}`, parentSlug: `platform-spec/domains/${domainName}/areas/${areaName}`, authority: "normative", disposition: "normative-standard", layout: "feature", specLevel: "feature", domain: domainName, area: areaName, feature: featureName, article: null, decision: null });
	}
	const article = normalized.match(new RegExp(`^openspec/documents/platform-spec/(${segment})--(${segment})--(${segment})/articles/(${segment})\\.md$`));
	if (article) return relatedIdentity("article", normalized, value(article, 1), value(article, 2), value(article, 3), value(article, 4));
	const decision = normalized.match(new RegExp(`^openspec/documents/platform-spec/(${segment})--(${segment})--(${segment})/decisions/(\\d{4}-${segment})\\.md$`));
	if (decision) return relatedIdentity("decision", normalized, value(decision, 1), value(decision, 2), value(decision, 3), value(decision, 4));
	throw new Error(`Unknown canonical standard document path: ${canonicalPath}`);
}

function relatedIdentity(kind: "article" | "decision", canonicalPath: string, domain: string, area: string, feature: string, name: string): SpecDocumentIdentity {
	const capability = `${domain}--${area}--${feature}`;
	const collection = kind === "article" ? "articles" : "decisions";
	return identity({ artifactKind: kind, kind, key: `${capability}/${collection}/${name}`, capability, canonicalPath, publicSlug: `platform-spec/capabilities/${capability}/${collection}/${name}`, parentCapability: capability, parentSlug: `platform-spec/capabilities/${capability}`, authority: "informative", disposition: "informative-by-policy", layout: kind === "article" ? "article" : "adr", specLevel: kind === "article" ? "article" : "adr", domain, area, feature, article: kind === "article" ? name : null, decision: kind === "decision" ? name : null });
}
