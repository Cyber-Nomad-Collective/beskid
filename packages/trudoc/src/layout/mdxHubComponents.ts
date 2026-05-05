/**
 * Hub MDX: extract and validate known platform-spec components (CI-safe, no full MDX parse).
 * PascalCase opening tags must be listed in `HUB_COMPONENT_PROP_SCHEMAS` or layout verification fails.
 */
import { z } from 'zod';
import type { LayoutDiagnostic } from './schema';

const domainTilesPropsSchema = z.object({
	pathPrefix: z.string().min(1),
	heading: z.string().optional(),
});

const domainOrAreaHubPropsSchema = z.object({
	pathPrefix: z.string().min(1),
	summaryTitle: z.string().optional(),
});

const specPageHeaderPropsSchema = z.object({
	ownerName: z.string().min(1),
	ownerEmail: z.string().min(3),
	submitterName: z.string().min(1),
	submitterEmail: z.string().min(3),
	status: z.enum(['Standard', 'Proposed']).optional(),
});

const specSectionPropsSchema = z.object({
	id: z.string().min(1),
	title: z.string().optional(),
});

const emptyPropsSchema = z.object({}).strict();

/** Tag name -> Zod schema for string-ish props parsed from opening tag attributes. */
export const HUB_COMPONENT_PROP_SCHEMAS: Record<string, z.ZodType<Record<string, unknown>>> = {
	DomainTiles: domainTilesPropsSchema as z.ZodType<Record<string, unknown>>,
	DomainOrAreaHub: domainOrAreaHubPropsSchema as z.ZodType<Record<string, unknown>>,
	SpecPageHeader: specPageHeaderPropsSchema as z.ZodType<Record<string, unknown>>,
	SpecSection: specSectionPropsSchema as z.ZodType<Record<string, unknown>>,
	SpecArticleChrome: emptyPropsSchema as z.ZodType<Record<string, unknown>>,
	PlatformSpecHome: emptyPropsSchema as z.ZodType<Record<string, unknown>>,
};

export type ParsedOpeningTag = {
	name: string;
	index: number;
	raw: string;
	props: Record<string, string>;
};

/** Parse `key="value"` and `key='value'` from first line of an opening tag (multiline tags not supported). */
function parseOpeningTag(source: string, start: number): ParsedOpeningTag | null {
	const lt = source.indexOf('<', start);
	if (lt < 0) return null;
	const gt = source.indexOf('>', lt);
	if (gt < 0) return null;
	const chunk = source.slice(lt + 1, gt).trim();
	const firstSpace = chunk.search(/\s/);
	const name = firstSpace < 0 ? chunk : chunk.slice(0, firstSpace).replace(/\/$/, '');
	if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) return null;
	const attrPart = firstSpace < 0 ? '' : chunk.slice(firstSpace + 1);
	const props: Record<string, string> = {};
	const re = /(\w+)=\s*(?:"([^"]*)"|'([^']*)')/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(attrPart)) !== null) {
		props[m[1]] = m[2] ?? m[3] ?? '';
	}
	return { name, index: lt, raw: source.slice(lt, gt + 1), props };
}

/** Opening tags for components registered in {@link HUB_COMPONENT_PROP_SCHEMAS}. */
export function* iterHubOpeningTags(source: string): Generator<ParsedOpeningTag> {
	for (const t of iterPascalCaseOpeningTags(source)) {
		if (HUB_COMPONENT_PROP_SCHEMAS[t.name]) yield t;
	}
}

/** Every PascalCase JSX-style opening tag in `source` (best-effort; not a full MDX parse). */
export function* iterPascalCaseOpeningTags(source: string): Generator<ParsedOpeningTag> {
	let i = 0;
	while (i < source.length) {
		const t = parseOpeningTag(source, i);
		if (!t) break;
		i = t.index + t.raw.length;
		if (/^[A-Z]/.test(t.name)) yield t;
	}
}

function diag(
	code: string,
	severity: LayoutDiagnostic['severity'],
	slug: string,
	message: string,
	detail?: string,
): LayoutDiagnostic {
	return { code, severity, slug, message, detail };
}

export function validateHubMdxComponents(slug: string, contentPath: string, body: string): LayoutDiagnostic[] {
	const out: LayoutDiagnostic[] = [];
	for (const tag of iterPascalCaseOpeningTags(body)) {
		const schema = HUB_COMPONENT_PROP_SCHEMAS[tag.name];
		if (!schema) {
			out.push(
				diag(
					'MDX_UNKNOWN_COMPONENT',
					'error',
					slug,
					`Unknown MDX component <${tag.name} /> in platform-spec hub`,
					`${contentPath}: add it to HUB_COMPONENT_PROP_SCHEMAS in trudoc (or use markdown-first fences per MARKDOWN-FIRST.md).`,
				),
			);
			continue;
		}
		const parsed = schema.safeParse(tag.props);
		if (!parsed.success) {
			const msg = parsed.error.issues.map((is) => `${is.path.join('.') || tag.name}: ${is.message}`).join('; ');
			out.push(
				diag(
					'MDX_COMPONENT_PROPS',
					'error',
					slug,
					`Invalid <${tag.name} /> props`,
					`${contentPath}: ${msg}`,
				),
			);
		}
	}
	return out;
}
