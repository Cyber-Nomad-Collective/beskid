import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	getAuthHubSetupStatus,
	submitAuthHubSetup,
} from "#/server/auth-hub-setup.server";

const setupInputSchema = z.object({
	authHubPublicUrl: z.string().url().optional(),
	pairingCode: z.string().min(4),
	platformSpecPublicUrl: z.string().url(),
	approverLogin: z.string().min(1),
	setupToken: z.string().min(1).optional(),
});

export const getAuthHubSetupStatusFn = createServerFn({
	method: "GET",
}).handler(async () => getAuthHubSetupStatus());

export const submitAuthHubSetupFn = createServerFn({ method: "POST" })
	.inputValidator(setupInputSchema)
	.handler(async ({ data }) => {
		const { getRequest } = await import("@tanstack/react-start/server");
		const result = await submitAuthHubSetup(getRequest(), data);
		if ("error" in result) {
			throw new Error(result.error);
		}
		return { ok: true as const };
	});
