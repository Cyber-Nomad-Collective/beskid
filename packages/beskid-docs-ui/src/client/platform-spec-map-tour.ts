/**
 * Intro.js onboarding for the platform-spec map page only.
 * @see https://introjs.com/docs — step highlights, overlay, keyboard navigation, and “don’t show again”.
 */
import 'intro.js/minified/introjs.min.css';
import 'intro.js/themes/introjs-dark.css';
import introJs from 'intro.js';

const TOUR_SESSION_KEY = 'beskid-platform-spec-map-tour-session';
const TOUR_COOKIE_NAME = 'beskid_platform_spec_map_tour';

export type PlatformSpecMapTourOptions = {
	force?: boolean;
	onVisibilityChange?: (isOpen: boolean) => void;
};

export type PlatformSpecMapTourHandle = {
	exit: () => void;
	isOpen: () => boolean;
};

function hasTourCookie(): boolean {
	if (typeof document === 'undefined') return false;
	return document.cookie.split(';').some((entry) => entry.trim().startsWith(`${TOUR_COOKIE_NAME}=`));
}

function clearTourCookie(): void {
	if (typeof document === 'undefined') return;
	document.cookie = `${TOUR_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export async function startPlatformSpecMapTour(options: PlatformSpecMapTourOptions = {}): Promise<PlatformSpecMapTourHandle | null> {
	if (typeof window === 'undefined') return null;
	const { force = false, onVisibilityChange } = options;
	if (!force && window.sessionStorage.getItem(TOUR_SESSION_KEY)) return null;
	if (!force && hasTourCookie()) return null;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
	if (force) clearTourCookie();

	const canvas = document.querySelector<HTMLElement>('[data-map-tour="canvas"]');
	const controls = document.querySelector<HTMLElement>('[data-map-tour="controls"]');
	const legend = document.querySelector<HTMLElement>('[data-map-tour="legend"]');
	const panel = document.querySelector<HTMLElement>('[data-map-tour="panel"]');
	if (!canvas || !controls) return null;

	const tour = introJs.tour(document.body);
	let isOpen = false;
	tour.setOptions({
		tooltipClass: 'platform-spec-introjs-tooltip',
		nextLabel: 'Next',
		prevLabel: 'Back',
		doneLabel: 'Done',
		skipLabel: 'Skip',
		showProgress: true,
		exitOnOverlayClick: true,
		scrollToElement: false,
		dontShowAgain: true,
		dontShowAgainLabel: 'Do not show this guide again',
		dontShowAgainCookie: TOUR_COOKIE_NAME,
		dontShowAgainCookieDays: 365,
		steps: [
			{
				title: 'Platform map',
				intro:
					'Start here: this canvas is the interactive map of Beskid platform specs. Domains are major slices, areas are topic groups, and features are leaf pages. Drag to pan, scroll or pinch to zoom, then single-click nodes to expand or collapse.',
				element: canvas,
				position: 'right',
				tooltipClass: 'platform-spec-introjs-tooltip--wide',
			},
			{
				title: 'Tools & search',
				intro:
					'Use controls from left to right: <strong>Fit</strong> reframes visible nodes, <strong>Collapse</strong> returns to domains, <strong>Expand</strong> reveals all nodes, and <strong>Options</strong> provides bulk actions and reset. The teal button opens <strong>search</strong> to jump to a node by name.',
				element: controls,
				position: 'left',
				tooltipClass: 'platform-spec-introjs-tooltip--wide',
			},
			...(legend
				? [
						{
							title: 'Legend',
							intro:
								'Colors encode hierarchy: <strong>Hub</strong> (map root), <strong>Domain</strong>, <strong>Area</strong>, and <strong>Feature</strong> leaves. Domain hues stay consistent so you can quickly track which platform slice a node belongs to.',
							element: legend,
							position: 'right',
							tooltipClass: 'platform-spec-introjs-tooltip--compact',
						},
					]
				: []),
			...(panel
				? [
						{
							title: 'Details panel',
							intro:
								'Select any node to open details: breadcrumb path, short description, and relation notes. Use <strong>Focus on map</strong> to jump to the connected node without leaving the graph.',
							element: panel,
							position: 'left',
							tooltipClass: 'platform-spec-introjs-tooltip--wide',
						},
					]
				: []),
		],
	});

	const markSession = () => {
		try {
			window.sessionStorage.setItem(TOUR_SESSION_KEY, '1');
		} catch {
			/* ignore */
		}
	};

	const onClose = () => {
		markSession();
		isOpen = false;
		onVisibilityChange?.(false);
	};

	tour.onComplete(onClose);
	tour.onExit(onClose);
	isOpen = true;
	onVisibilityChange?.(true);

	await tour.start();
	return {
		exit: () => {
			if (!isOpen) return;
			tour.exit(true);
		},
		isOpen: () => isOpen,
	};
}

export async function startPlatformSpecMapTourIfNeeded(): Promise<void> {
	await startPlatformSpecMapTour();
}
