import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

const specPerson = z.object({
	name: nonEmptyString,
	email: z.string().trim().email(),
});

const relatedTopicSchema = z.object({
	type: z.enum(['Domain', 'Area', 'Feature']),
	title: nonEmptyString,
	href: nonEmptyString,
	relation: nonEmptyString.optional(),
	blocker: z.boolean().optional(),
	severity: z.enum(['informational', 'low', 'medium', 'high', 'critical']).optional(),
});

const platformGraphSchema = z.object({
	source: nonEmptyString.optional(),
	node: nonEmptyString.optional(),
	mode: z.enum(['map', 'embedded']).optional(),
});

const architectureGraphSchema = z.object({
	source: nonEmptyString.optional(),
	entryNode: nonEmptyString.optional(),
	layout: z.enum(['force', 'hierarchy']).optional(),
	tags: z.array(nonEmptyString).optional(),
});

const platformSpecBaseSchema = z.object({
	owner: specPerson,
	submitter: specPerson,
	replacement: nonEmptyString.optional(),
	lastReviewed: z.union([z.string(), z.date()]).optional(),
	canonicalSlug: nonEmptyString.optional(),
	supersedes: nonEmptyString.optional(),
	relatedTopics: z.array(relatedTopicSchema).optional(),
	platformGraph: platformGraphSchema.optional(),
	architectureGraph: architectureGraphSchema.optional(),
});

const platformSpecStatusSchema = z.enum(['Standard', 'Proposed']);

export const domainSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal('domain'),
	status: z.undefined().optional(),
});

export const areaSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal('area'),
	status: z.undefined().optional(),
});

export const featureSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal('feature'),
	status: platformSpecStatusSchema,
});

export const articleSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal('article'),
	status: platformSpecStatusSchema,
});

export const platformSpecNodeSchema = z.discriminatedUnion('specLevel', [
	domainSpecSchema,
	areaSpecSchema,
	featureSpecSchema,
	articleSpecSchema,
]);

/**
 * Starlight `docs` collection extension for platform-spec style metadata.
 * Keep in sync with validators in `trudoc/layout` / site verify scripts.
 */
export const platformSpecExtend = z.object({
	specLevel: z.enum(['domain', 'area', 'component', 'feature', 'article']).optional(),
	status: platformSpecStatusSchema.optional(),
	owner: specPerson.optional(),
	submitter: specPerson.optional(),
	replacement: nonEmptyString.optional(),
	lastReviewed: z.union([z.string(), z.date()]).optional(),
	canonicalSlug: nonEmptyString.optional(),
	supersedes: nonEmptyString.optional(),
	relatedTopics: z.array(relatedTopicSchema).optional(),
	platformGraph: platformGraphSchema.optional(),
	architectureGraph: architectureGraphSchema.optional(),
});
