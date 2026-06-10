import { createServerFn } from "@tanstack/react-start";

import type { AuthUser } from "#/server/auth.server";
import { resolveAuthUser } from "#/server/auth.server";

export const getAuthUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthUser | null> => resolveAuthUser(),
);
