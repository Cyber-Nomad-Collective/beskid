/** True when the UI is built for a hosted Beskid Nexus deployment (not local CLI onboarding). */
export const isHostedNexus = (): boolean => {
	if (import.meta.env.VITE_NEXUS_HOSTED === "1") return true;
	if (import.meta.env.VITE_NEXUS_HOSTED === "0") return false;
	// Production bundles are served by `gitnexus serve` on the same origin.
	return !import.meta.env.DEV;
};

/** Show CLI install instructions only for local Vite dev without a reachable API. */
export const showLocalDevOnboarding = (): boolean => import.meta.env.DEV;
