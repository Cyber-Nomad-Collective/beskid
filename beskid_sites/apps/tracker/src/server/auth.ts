import { createServerFn } from "@tanstack/react-start";

import type { AuthUser } from "#/lib/github/types";
import { resolveAuthUser } from "#/server/auth.server";

export const getAuthUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthUser | null> => resolveAuthUser(),
);
