export const blogStatuses = ['released', 'truncated', 'in-progress'] as const;

export type BlogStatus = (typeof blogStatuses)[number];
export type BlogEntry = { data: { date: Date; blogStatus: BlogStatus } };

export const sortBlogEntries = <T extends BlogEntry>(entries: T[]) =>
	[...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

export const blogStatusLabel = (status: BlogStatus) =>
	({
		released: 'Released historical band',
		truncated: 'Truncated delivery band',
		'in-progress': 'In progress',
	})[status];
