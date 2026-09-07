import "#beskid-hub-entry";
import "#beskid-hub-css";

import { ThemeProvider } from "@cyber-nomad-collective/beskid-shell-core/client";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { isHostedNexus } from "./config/nexus-mode";
import { ensureBackendUrlFromPage } from "./services/backend-client";
import "./index.css";

// Hosted deployments must use same-origin `/api`, not a stale localStorage URL from dev.
if (isHostedNexus()) {
	try {
		localStorage.removeItem("gitnexus-backend-url");
	} catch {
		// ignore
	}
}
ensureBackendUrlFromPage();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider defaultTheme="dark">
			<App />
		</ThemeProvider>
	</React.StrictMode>,
);
