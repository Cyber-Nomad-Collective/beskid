import { createServerFn } from "@tanstack/react-start";

import { loadManifest } from "#/lib/manifest/loader";
import type { Manifest } from "#/lib/manifest/types";

export const fetchManifest = createServerFn({ method: "GET" }).handler(
	async (): Promise<Manifest> => {
		return loadManifest();
	},
);
