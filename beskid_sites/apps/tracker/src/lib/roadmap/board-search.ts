import { z } from "zod";

export const boardSearchSchema = z.object({
	q: z.string().optional(),
	workstream: z.string().optional(),
	domain: z.string().optional(),
	area: z.string().optional(),
	feature: z.string().optional(),
	create: z.literal("1").optional(),
});

export type BoardFilterState = {
	q?: string;
	workstream?: string;
	domain?: string;
	area?: string;
	feature?: string;
};

export type BoardSearchParams = BoardFilterState & {
	create?: "1";
};
