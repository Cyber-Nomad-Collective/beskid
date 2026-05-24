/** Doc-area `<html>` flags (platform-spec, book) from a site pathname. */
export function docAreaFromPathname(pathname: string): {
	platformSpec: boolean;
	book: boolean;
} {
	const path = pathname.replace(/\/+$/, '') || '/';
	return {
		platformSpec: path === '/platform-spec' || path.startsWith('/platform-spec/'),
		book: path === '/book' || path.startsWith('/book/'),
	};
}

export function applyDocAreaHtmlAttrs(pathname: string, root: HTMLElement = document.documentElement): void {
	const { platformSpec, book } = docAreaFromPathname(pathname);
	root.toggleAttribute('data-platform-spec', platformSpec);
	root.toggleAttribute('data-book', book);
}
