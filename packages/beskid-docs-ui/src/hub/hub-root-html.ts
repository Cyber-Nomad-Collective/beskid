import {
	BESKID_SERVICES,
	type BeskidService,
} from "../data/beskid-services";
import { HUB_CLOSE_ICON_SVG } from "./beskid-hub-close-icon";
import { hubLauncherIconSvg } from "./icons";

function escapeHtmlAttr(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

export interface HubRootHtmlOptions {
	dialogId: string;
	services?: BeskidService[];
	className?: string;
}

/** Light-DOM hub markup (shared by `<beskid-hub>`, Astro, and Blazor launcher). */
export function renderHubRootHtml({
	dialogId,
	services = BESKID_SERVICES,
	className,
}: HubRootHtmlOptions): string {
	const servicesJson = escapeHtmlAttr(JSON.stringify(services));
	const rootClass = className
		? `beskid-hub-root ${escapeHtmlAttr(className)}`
		: "beskid-hub-root";
	const safeDialogId = escapeHtmlAttr(dialogId);

	return `
<div class="${rootClass}" data-beskid-hub-root data-services="${servicesJson}">
	<button
		type="button"
		class="beskid-hub-trigger"
		data-beskid-hub-trigger
		aria-haspopup="dialog"
		aria-controls="${safeDialogId}"
		title="Beskid services"
	>
		${hubLauncherIconSvg()}
		<span class="sr-only">Open Beskid services</span>
	</button>
	<dialog id="${safeDialogId}" class="beskid-hub" data-beskid-hub>
		<header class="beskid-hub__header">
			<div>
				<h2 class="beskid-hub__title">Beskid</h2>
				<p class="beskid-hub__subtitle">Jump to a Beskid service</p>
			</div>
			<button type="button" class="beskid-hub__close" data-beskid-hub-close aria-label="Close">
				${HUB_CLOSE_ICON_SVG}
			</button>
		</header>
		<div class="beskid-hub__body">
			<div class="beskid-hub__grid" data-beskid-hub-grid></div>
		</div>
	</dialog>
</div>`.trim();
}
