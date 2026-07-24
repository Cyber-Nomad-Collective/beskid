import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { blogStatuses } from "./lib/blog";

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				blogStatus: z.enum(blogStatuses).optional(),
				date: z.coerce.date().optional(),
				release: z.string().optional(),
			}),
		}),
	}),
};
