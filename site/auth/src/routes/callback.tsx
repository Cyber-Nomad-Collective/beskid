import { createFileRoute, redirect } from "@tanstack/react-router";

import { handleCallbackGet } from "#/server/oauth.server";

export const Route = createFileRoute("/callback")({
	server: {
		handlers: {
			GET: ({ request }) => handleCallbackGet(request),
		},
	},
	component: CallbackPage,
});

function CallbackPage() {
	throw redirect({ to: "/" });
}
