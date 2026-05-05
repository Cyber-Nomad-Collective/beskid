import { z } from 'zod';

const specPerson = z.object({
	name: z.string(),
	email: z.string(),
});

const relatedTopic = z.object({
	type: z.enum(['Domain', 'Area', 'Feature']),
	title: z.string(),
	href: z.string(),
	relation: z.string().optional(),
	blocker: z.boolean().optional(),
	severity: z.enum(['informational', 'low', 'medium', 'high', 'critical']).optional(),
});

/**
 * Starlight `docs` collection extension for platform-spec style metadata.
 * Keep in sync with validators in `trudoc/layout` / site verify scripts.
 */
export const platformSpecExtend = z.object({
	specLevel: z.enum(['domain', 'area', 'component', 'feature', 'article']).optional(),
	status: z.enum(['Standard', 'Proposed']).optional(),
	owner: specPerson.optional(),
	submitter: specPerson.optional(),
	replacement: z.string().optional(),
	lastReviewed: z.union([z.string(), z.date()]).optional(),
	canonicalSlug: z.string().optional(),
	supersedes: z.string().optional(),
	relatedTopics: z.array(relatedTopic).optional(),
	platformGraph: z
		.object({
			source: z.string().optional(),
			node: z.string().optional(),
			mode: z.enum(['map', 'embedded']).optional(),
		})
		.optional(),
	architectureGraph: z
		.object({
			source: z.string().optional(),
			entryNode: z.string().optional(),
			layout: z.enum(['force', 'hierarchy']).optional(),
			tags: z.array(z.string()).optional(),
		})
		.optional(),
});
