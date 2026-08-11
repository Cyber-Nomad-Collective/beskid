import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@beskid/ui-react/ui/dropdown-menu';

function BlogShareMenu() {
	const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

	function copyLink() {
		void navigator.clipboard?.writeText(shareUrl);
	}

	function shareOnX() {
		const url = new URL('https://x.com/intent/post');
		url.searchParams.set('url', shareUrl);
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="blog-share__trigger" type="button" aria-label="Share this post">
					<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></svg>
					<span>Share</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="blog-share__content" align="end">
				<DropdownMenuItem onSelect={copyLink}>Copy link</DropdownMenuItem>
				<DropdownMenuItem onSelect={shareOnX}>Share on X</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default BlogShareMenu;
