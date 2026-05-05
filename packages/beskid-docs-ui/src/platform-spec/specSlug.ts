type EntryLike = {
	slug?: string;
	id: string;
};

function trimSlashes(value: string): string {
	return value.replace(/^\/+|\/+$/g, '');
}

export function normalizeDocSlug(value: string): string {
	const withoutExt = value.replace(/\.(md|mdx)$/i, '');
	const withoutIndex = withoutExt.replace(/\/index$/i, '');
	return trimSlashes(withoutIndex);
}

export function docEntrySlug(entry: EntryLike): string {
	if (entry.slug != null && entry.slug !== '') return normalizeDocSlug(entry.slug);
	return normalizeDocSlug(entry.id);
}

export function docEntryHref(value: string): string {
	const slug = normalizeDocSlug(value);
	if (slug === '') return '/';
	return `/${slug}/`;
}

export function normalizedPathname(pathname: string): string {
	return normalizeDocSlug(pathname);
}
