import { z } from 'zod';

/** Declared in each node’s `layout.json` (and root). */
export const layoutLevelSchema = z.enum(['root', 'domain', 'area', 'component', 'feature', 'article']);

export type LayoutLevel = z.infer<typeof layoutLevelSchema>;

/** Built-in preset keys resolved in code (DRY defaults). */
export const layoutPresetKeySchema = z.enum([
	'root-default',
	'domain-default',
	'area-default',
	'area-sparse',
	'feature-contract-default',
	'feature-hub-default',
	'feature-area-hub-default',
	'article-default',
]);

export type LayoutPresetKey = z.infer<typeof layoutPresetKeySchema>;

const sectionRuleSchema = z.object({
	id: z.string().min(1),
	required: z.boolean().default(true),
	/** How to match this section in the MDX/Markdown body. */
	kind: z.enum(['specSection', 'markdownHeading']).default('specSection'),
});

export type SectionRule = z.infer<typeof sectionRuleSchema>;

export const documentStructureStepSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('specSection'),
		id: z.string().min(1),
		required: z.boolean().default(true),
	}),
	z.object({
		kind: z.literal('markdownHeading'),
		slug: z.string().min(1),
		required: z.boolean().default(true),
	}),
	z.object({
		kind: z.literal('component'),
		name: z.string().min(1),
		required: z.boolean().default(false),
	}),
]);

export type DocumentStructureStep = z.infer<typeof documentStructureStepSchema>;

export const documentStructureSchema = z.object({
	/** Shorthand: these `<SpecSection id>` blocks must appear in source order. */
	orderedSpecSectionIds: z.array(z.string().min(1)).optional(),
	/** Richer ordered contract: sections, headings, and hub components in document order. */
	orderedSequence: z.array(documentStructureStepSchema).optional(),
});

export type DocumentStructure = z.infer<typeof documentStructureSchema>;

/** Feature hubs: constraints on `*.mdx` siblings (excluding `index.*`). */
export const childArticlesConstraintSchema = z.object({
	minDirectArticles: z.number().int().nonnegative().optional(),
	/** Every direct article must have non-empty `title` in YAML frontmatter. */
	requireYamlTitle: z.boolean().optional(),
});

export type ChildArticlesConstraint = z.infer<typeof childArticlesConstraintSchema>;

const domainTilesPropsSchema = z.object({
	pathPrefix: z.string().min(1),
	heading: z.string().default('Explore'),
});

/** v1: two-column only nests `domainTiles` (no recursion) — enough for common hub layouts. */
const twoColumnPropsSchema = z.object({
	gap: z.enum(['sm', 'md', 'lg']).default('md'),
	left: z.array(z.object({ type: z.literal('domainTiles'), props: domainTilesPropsSchema })),
	right: z.array(z.object({ type: z.literal('domainTiles'), props: domainTilesPropsSchema })),
});

export const widgetSpecSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('domainTiles'),
		props: domainTilesPropsSchema,
	}),
	z.object({
		type: z.literal('twoColumn'),
		props: twoColumnPropsSchema,
	}),
]);

export type WidgetSpec = z.infer<typeof widgetSpecSchema>;

export type TwoColumnProps = z.infer<typeof twoColumnPropsSchema>;

/** Per-article defaults when living under a feature directory (see `articleDefaults` on feature layouts). */
export const articleDefaultsSchema = z.object({
	extends: layoutPresetKeySchema.optional(),
	sections: z.array(sectionRuleSchema).optional(),
	minSpecSections: z.number().int().nonnegative().optional(),
	minMarkdownHeadings: z.number().int().nonnegative().optional(),
	widgets: z.array(widgetSpecSchema).optional(),
	documentStructure: documentStructureSchema.optional(),
});

export type ArticleDefaults = z.infer<typeof articleDefaultsSchema>;

/** Parsed `layout.json` or `<stem>.layout.json` for articles. */
export const layoutContractFileSchema = z.object({
	version: z.literal(1),
	level: layoutLevelSchema,
	/** Preset to merge before this file’s fields (later wins). */
	extends: layoutPresetKeySchema.optional(),
	sections: z.array(sectionRuleSchema).optional(),
	/** When set, at least this many `<SpecSection …>` blocks must exist (ids may vary). */
	minSpecSections: z.number().int().nonnegative().optional(),
	/** Minimum `## …` headings (article-style prose). */
	minMarkdownHeadings: z.number().int().nonnegative().optional(),
	widgets: z.array(widgetSpecSchema).optional(),
	pathPrefix: z.string().optional(),
	tilesHeading: z.string().optional(),
	/** Feature hub only: defaults for `*.mdx` articles in this folder unless overridden by `<stem>.layout.json`. */
	articleDefaults: articleDefaultsSchema.optional(),
	/** Optional full-document ordering (sections, headings, key components). Feature / area / domain hubs. */
	documentStructure: documentStructureSchema.optional(),
	/** Feature hub only: validate sibling article files under this directory. */
	childArticles: childArticlesConstraintSchema.optional(),
	/** Arbitrary validator parameters (reserved for future checks). */
	validators: z.record(z.string(), z.unknown()).optional(),
});

export type LayoutContractFile = z.infer<typeof layoutContractFileSchema>;

/** After merging presets + parent chain + node file. */
export const effectiveLayoutSchema = layoutContractFileSchema.extend({
	extends: layoutPresetKeySchema.optional(),
	effectiveSections: z.array(sectionRuleSchema),
	effectiveMinSpecSections: z.number().int().nonnegative().optional(),
	effectiveMinMarkdownHeadings: z.number().int().nonnegative().optional(),
	effectiveWidgets: z.array(widgetSpecSchema),
	effectiveDocumentStructure: documentStructureSchema.optional(),
	effectiveChildArticles: childArticlesConstraintSchema.optional(),
});

export type EffectiveLayout = z.infer<typeof effectiveLayoutSchema>;

export const layoutTreeNodeSchema = z.object({
	slug: z.string(),
	contentPath: z.string(),
	level: layoutLevelSchema,
	layoutPath: z.string().nullable(),
	/** Raw file before merge (for debugging). */
	rawLayout: layoutContractFileSchema.optional(),
	effective: effectiveLayoutSchema,
});

export type LayoutTreeNode = z.infer<typeof layoutTreeNodeSchema>;

export const diagnosticSchema = z.object({
	code: z.string(),
	severity: z.enum(['error', 'warning', 'info']),
	slug: z.string(),
	message: z.string(),
	detail: z.string().optional(),
});

export type LayoutDiagnostic = z.infer<typeof diagnosticSchema>;

export const completenessReportSchema = z.object({
	generatedAt: z.string(),
	summary: z.object({
		nodes: z.number().int(),
		errors: z.number().int(),
		warnings: z.number().int(),
	}),
	nodes: z.array(
		z.object({
			slug: z.string(),
			level: layoutLevelSchema,
			status: z.enum(['ok', 'warn', 'fail']),
			sections: z.array(
				z.object({
					id: z.string(),
					required: z.boolean(),
					found: z.boolean(),
				}),
			),
			counts: z.object({
				specSections: z.number().int(),
				markdownH2: z.number().int(),
			}),
			messages: z.array(diagnosticSchema),
		}),
	),
	diagnostics: z.array(diagnosticSchema),
});

export type CompletenessReport = z.infer<typeof completenessReportSchema>;

export function parseLayoutContractJson(raw: unknown, context: string): LayoutContractFile {
	const parsed = layoutContractFileSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
		throw new Error(`${context}: invalid layout.json — ${msg}`);
	}
	return parsed.data;
}
