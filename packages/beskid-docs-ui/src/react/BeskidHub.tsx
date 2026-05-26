/**
 * Canonical Beskid services hub (native `<dialog>`).
 * Same markup as `starlight/BeskidHubButton.astro`; React-controlled open/close.
 */

import { useCallback, useId, useRef } from "react";

import { BESKID_SERVICES } from "../data/beskid-services";
import { HUB_CLOSE_ICON_SVG } from "../hub/beskid-hub-close-icon";
import { hubIconSvg, hubLauncherIconSvg } from "../hub/icons";

export interface BeskidHubProps {
	className?: string;
}

export function BeskidHub({ className }: BeskidHubProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const dialogId = useId().replace(/:/g, "");

	const openHub = useCallback(() => {
		const dialog = dialogRef.current;
		if (!dialog?.showModal) return;
		if (!dialog.open) {
			dialog.showModal();
			dialog.querySelector<HTMLButtonElement>("[data-beskid-hub-close]")?.focus();
		}
	}, []);

	const closeHub = useCallback(() => {
		const dialog = dialogRef.current;
		if (dialog?.open) dialog.close();
	}, []);

	const servicesJson = JSON.stringify(BESKID_SERVICES);
	const rootClass = className ? `beskid-hub-root ${className}` : "beskid-hub-root";

	return (
		<div className={rootClass} data-beskid-hub-root data-services={servicesJson}>
			<button
				type="button"
				className="beskid-hub-trigger"
				data-beskid-hub-trigger
				aria-haspopup="dialog"
				aria-controls={dialogId}
				title="Beskid services"
				onClick={openHub}
			>
				<span dangerouslySetInnerHTML={{ __html: hubLauncherIconSvg() }} />
				<span className="sr-only">Open Beskid services</span>
			</button>

			<dialog
				ref={dialogRef}
				id={dialogId}
				className="beskid-hub"
				data-beskid-hub
				onCancel={(event) => {
					event.preventDefault();
					closeHub();
				}}
				onClick={(event) => {
					if (event.target === dialogRef.current) closeHub();
				}}
			>
				<header className="beskid-hub__header">
					<div>
						<h2 className="beskid-hub__title">Beskid</h2>
						<p className="beskid-hub__subtitle">Jump to a Beskid service</p>
					</div>
					<button
						type="button"
						className="beskid-hub__close"
						data-beskid-hub-close
						aria-label="Close"
						onClick={closeHub}
					>
						<span dangerouslySetInnerHTML={{ __html: HUB_CLOSE_ICON_SVG }} />
					</button>
				</header>
				<div className="beskid-hub__body">
					<div className="beskid-hub__grid">
						{BESKID_SERVICES.map((service) => (
							<a
								key={service.id}
								className="beskid-hub__tile"
								href={service.href}
								onClick={closeHub}
							>
								<span dangerouslySetInnerHTML={{ __html: hubIconSvg(service.icon) }} />
								<span className="beskid-hub__tile-label">{service.label}</span>
							</a>
						))}
					</div>
				</div>
			</dialog>
		</div>
	);
}
