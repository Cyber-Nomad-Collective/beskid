import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { blogStatuses } from "./lib/blog";
import { docsDiagramPolicies, docsPageKinds } from "./data/docs-coverage";

const docsAuthorityStatus = z.enum([
	"normative",
	"informative",
	"generated",
	"preview",
	"deprecated",
	"security-sensitive",
]);

const docsContract = z.object({
	audience: z.array(z.string().min(1)).min(1),
	authority: z.object({
		status: docsAuthorityStatus,
		sourceLabel: z.string().min(1),
		sourceHref: z.string().min(1),
		limits: z.string().min(1),
	}),
	verified: z.object({
		revision: z.string().regex(/^[0-9a-f]{40}$/),
		date: z.coerce.date(),
	}),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
				extend: z.object({
				blogStatus: z.enum(blogStatuses).optional(),
				date: z.coerce.date().optional(),
				release: z.string().optional(),
				...docsContract.partial().shape,
				pageKind: z.enum(docsPageKinds),
				diagramPolicy: z.enum(docsDiagramPolicies),
				diagramOmissionReason: z.string().min(1).optional(),
			}),
		}),
	}),
};
