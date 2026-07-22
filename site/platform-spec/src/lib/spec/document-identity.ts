export type SpecArtifactKind =
	| "domain"
	| "area"
	| "feature"
	| "article"
	| "decision";

export type SpecDocumentKind =
	| "taxonomy-domain"
	| "taxonomy-area"
	| "feature"
	| "article"
	| "decision";

export type SpecDocumentAuthority = "normative" | "informative";
export type SpecDocumentDisposition =
	| "provisional-taxonomy"
	| "normative-standard"
	| "informative-by-policy";

export type SpecDocumentIdentityInput =
	| { kind: "domain"; domain: string }
	| { kind: "area"; domain: string; area: string }
	| {
			kind: "feature";
			domain: string;
			area: string;
			feature: string;
	  }
	| {
			kind: "article";
			domain: string;
			area: string;
			feature: string;
			article: string;
	  }
	| {
			kind: "decision";
			domain: string;
			area: string;
			feature: string;
			decision: string;
	  };

export interface SpecDocumentIdentity {
	artifactKind: SpecArtifactKind;
	kind: SpecDocumentKind;
	key: string;
	capability: string;
	canonicalPath: string;
	publicSlug: string;
	href: string;
	parentCapability: string;
	parentSlug: string;
	authority: SpecDocumentAuthority;
	disposition: SpecDocumentDisposition;
	layout: "_default" | "feature" | "article" | "adr";
	specLevel: "domain" | "area" | "feature" | "article" | "adr";
	domain: string;
	area: string | null;
	feature: string | null;
	article: string | null;
	decision: string | null;
}

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DECISION = /^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function segment(name: string, value: unknown): string {
	if (typeof value !== "string" || !SEGMENT.test(value)) {
		throw new Error(`Invalid ${name} segment: ${String(value)}`);
	}
	return value;
}

function identity(
	values: Omit<SpecDocumentIdentity, "href">,
): SpecDocumentIdentity {
	return { ...values, href: `/${values.publicSlug}/` };
}

export function resolveDocumentIdentity(
	input: SpecDocumentIdentityInput,
): SpecDocumentIdentity {
	if (!input || typeof input !== "object") {
		throw new Error("Document identity input is required");
	}
	const domain = segment("domain", input.domain);

	switch (input.kind) {
		case "domain": {
			const capability = `taxonomy--${domain}`;
			return identity({
				artifactKind: "domain",
				kind: "taxonomy-domain",
				key: capability,
				capability,
				canonicalPath: `openspec/specs/${capability}/spec.md`,
				publicSlug: `platform-spec/domains/${domain}`,
				parentCapability: "platform-spec",
				parentSlug: "platform-spec",
				authority: "normative",
				disposition: "provisional-taxonomy",
				layout: "_default",
				specLevel: "domain",
				domain,
				area: null,
				feature: null,
				article: null,
				decision: null,
			});
		}
		case "area": {
			const area = segment("area", input.area);
			const capability = `taxonomy--${domain}--${area}`;
			return identity({
				artifactKind: "area",
				kind: "taxonomy-area",
				key: capability,
				capability,
				canonicalPath: `openspec/specs/${capability}/spec.md`,
				publicSlug: `platform-spec/domains/${domain}/areas/${area}`,
				parentCapability: `taxonomy--${domain}`,
				parentSlug: `platform-spec/domains/${domain}`,
				authority: "normative",
				disposition: "provisional-taxonomy",
				layout: "_default",
				specLevel: "area",
				domain,
				area,
				feature: null,
				article: null,
				decision: null,
			});
		}
		case "feature": {
			const area = segment("area", input.area);
			const feature = segment("feature", input.feature);
			const capability = `${domain}--${area}--${feature}`;
			return identity({
				artifactKind: "feature",
				kind: "feature",
				key: capability,
				capability,
				canonicalPath: `openspec/specs/${capability}/spec.md`,
				publicSlug: `platform-spec/capabilities/${capability}`,
				parentCapability: `taxonomy--${domain}--${area}`,
				parentSlug: `platform-spec/domains/${domain}/areas/${area}`,
				authority: "normative",
				disposition: "normative-standard",
				layout: "feature",
				specLevel: "feature",
				domain,
				area,
				feature,
				article: null,
				decision: null,
			});
		}
		case "article": {
			const area = segment("area", input.area);
			const feature = segment("feature", input.feature);
			const article = segment("article", input.article);
			const capability = `${domain}--${area}--${feature}`;
			return identity({
				artifactKind: "article",
				kind: "article",
				key: `${capability}/articles/${article}`,
				capability,
				canonicalPath: `openspec/documents/platform-spec/${capability}/articles/${article}.md`,
				publicSlug: `platform-spec/capabilities/${capability}/articles/${article}`,
				parentCapability: capability,
				parentSlug: `platform-spec/capabilities/${capability}`,
				authority: "informative",
				disposition: "informative-by-policy",
				layout: "article",
				specLevel: "article",
				domain,
				area,
				feature,
				article,
				decision: null,
			});
		}
		case "decision": {
			const area = segment("area", input.area);
			const feature = segment("feature", input.feature);
			if (typeof input.decision !== "string" || !DECISION.test(input.decision)) {
				throw new Error(`Invalid decision segment: ${String(input.decision)}`);
			}
			const capability = `${domain}--${area}--${feature}`;
			return identity({
				artifactKind: "decision",
				kind: "decision",
				key: `${capability}/decisions/${input.decision}`,
				capability,
				canonicalPath: `openspec/documents/platform-spec/${capability}/decisions/${input.decision}.md`,
				publicSlug: `platform-spec/capabilities/${capability}/decisions/${input.decision}`,
				parentCapability: capability,
				parentSlug: `platform-spec/capabilities/${capability}`,
				authority: "informative",
				disposition: "informative-by-policy",
				layout: "adr",
				specLevel: "adr",
				domain,
				area,
				feature,
				article: null,
				decision: input.decision,
			});
		}
		default:
			throw new Error(
				`Unknown document kind: ${String((input as { kind?: unknown }).kind)}`,
			);
	}
}

export function resolveDocumentIdentityFromPath(
	canonicalPath: string,
): SpecDocumentIdentity {
	const normalized = canonicalPath.replaceAll("\\", "/");
	let match = normalized.match(
		/^openspec\/specs\/taxonomy--([a-z0-9]+(?:-[a-z0-9]+)*)\/spec\.md$/,
	);
	if (match) {
		return resolveDocumentIdentity({ kind: "domain", domain: match[1] });
	}
	match = normalized.match(
		/^openspec\/specs\/taxonomy--([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)\/spec\.md$/,
	);
	if (match) {
		return resolveDocumentIdentity({
			kind: "area",
			domain: match[1],
			area: match[2],
		});
	}
	match = normalized.match(
		/^openspec\/specs\/([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)\/spec\.md$/,
	);
	if (match && match[1] !== "taxonomy") {
		return resolveDocumentIdentity({
			kind: "feature",
			domain: match[1],
			area: match[2],
			feature: match[3],
		});
	}
	match = normalized.match(
		/^openspec\/documents\/platform-spec\/([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)\/articles\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/,
	);
	if (match) {
		return resolveDocumentIdentity({
			kind: "article",
			domain: match[1],
			area: match[2],
			feature: match[3],
			article: match[4],
		});
	}
	match = normalized.match(
		/^openspec\/documents\/platform-spec\/([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)\/decisions\/(\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*)\.md$/,
	);
	if (match) {
		return resolveDocumentIdentity({
			kind: "decision",
			domain: match[1],
			area: match[2],
			feature: match[3],
			decision: match[4],
		});
	}
	throw new Error(
		`Unknown canonical Platform Spec document path: ${canonicalPath}`,
	);
}
