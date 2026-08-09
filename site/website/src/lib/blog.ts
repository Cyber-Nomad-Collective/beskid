export const blogStatuses = ["released", "truncated", "in-progress"] as const;

export type BlogStatus = (typeof blogStatuses)[number];
export type BlogEntry = {
	id: string;
	data: { date: Date; blogStatus: BlogStatus; release?: string };
};

export const sortBlogEntries = <T extends BlogEntry>(entries: T[]) =>
	[...entries].sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id),
	);

export const splitBlogEntries = <T extends BlogEntry>(entries: T[]) => {
	const [featured, ...archive] = sortBlogEntries(entries);
	return { featured, archive };
};

export const blogStatusLabel = (status: BlogStatus) =>
	({
		released: "Published",
		truncated: "Truncated",
		"in-progress": "In progress",
	})[status];
