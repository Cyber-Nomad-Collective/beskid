import { createFileRoute } from "@tanstack/react-router";

import { env } from "#/env.server";

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface TrackerTaskLink {
	standardId: string;
	catalogRevision: string;
}

export interface CreateTrackerTaskInput extends TrackerTaskLink {
	title: string;
	description?: string;
}

function trackerUrl(path: string, baseUrl = env.TRACKER_PUBLIC_URL): URL {
	if (!baseUrl) throw new Error("Tracker public URL is not configured");
	return new URL(path, baseUrl);
}

function assertLink(link: TrackerTaskLink): void {
	if (!link.standardId.trim() || !link.catalogRevision.trim()) {
		throw new Error("OpenSpec task links require standardId and catalogRevision");
	}
}

async function responseJson(response: Response): Promise<unknown> {
	if (!response.ok) throw new Error(`Tracker request failed (${response.status})`);
	return response.json();
}

export async function listTrackerTasks(
	link: TrackerTaskLink,
	fetcher: Fetch = fetch,
	trackerBaseUrl?: string,
): Promise<unknown> {
	assertLink(link);
	const url = trackerUrl("/api/v1/tasks", trackerBaseUrl);
	url.searchParams.set("standardId", link.standardId);
	url.searchParams.set("catalogRevision", link.catalogRevision);
	return responseJson(await fetcher(url));
}

export async function createTrackerTask(
	input: CreateTrackerTaskInput,
	fetcher: Fetch = fetch,
	trackerBaseUrl?: string,
): Promise<unknown> {
	assertLink(input);
	if (!input.title.trim()) throw new Error("Tracker task title is required");
	return responseJson(
		await fetcher(trackerUrl("/api/v1/tasks", trackerBaseUrl), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
}

export const Route = createFileRoute("/api/v1/tracker/tasks")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				try {
					return Response.json(await listTrackerTasks({
						standardId: url.searchParams.get("standardId") ?? "",
						catalogRevision: url.searchParams.get("catalogRevision") ?? "",
					}));
				} catch (error) {
					return Response.json({ error: error instanceof Error ? error.message : "Tracker request failed" }, { status: 502 });
				}
			},
			POST: async ({ request }) => {
				try {
					return Response.json(await createTrackerTask(await request.json() as CreateTrackerTaskInput), { status: 201 });
				} catch (error) {
					return Response.json({ error: error instanceof Error ? error.message : "Tracker request failed" }, { status: 502 });
				}
			},
		},
	},
});
