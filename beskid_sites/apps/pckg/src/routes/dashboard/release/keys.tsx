import { createFileRoute } from "@tanstack/react-router";
import { ApiKeysCenter } from "#/components/release/api-keys-center";

/** Release center > API keys: list, create (one-time secret), revoke. */
export const Route = createFileRoute("/dashboard/release/keys")({
	component: ApiKeysCenter,
});
