/**
 * Downloads page — wraps the shared `DownloadsSection` from
 * `@cyber-nomad-collective/beskid-ui-react`, which fetches the latest CLI
 * release + packages and renders install tabs per platform.
 */

import { DownloadsSection } from "@cyber-nomad-collective/beskid-ui-react";

export function Downloads() {
	return (
		<div className="beskid-downloads">
			<header>
				<h1 className="beskid-downloads__title">Download Beskid</h1>
				<p className="beskid-downloads__lead">
					Install the Beskid CLI and VS Code extension. The shared downloads
					component below fetches the latest release from GitHub and renders
					platform-specific install instructions.
				</p>
			</header>
			<DownloadsSection />
		</div>
	);
}
