export interface LatestDelivery {
	version: string;
	downloadLabel: string;
}

type Fetch = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function latestDeliveryUrl(baseUrl: string): URL {
	return new URL("/api/v1/delivery/latest", baseUrl);
}

function malformedLatestDelivery(): Error {
	return new Error("Tracker latest delivery payload is malformed");
}

export async function fetchLatestDelivery(
	fetcher: Fetch = fetch,
	baseUrl = process.env.BESKID_TRACKER_API_URL?.trim(),
): Promise<LatestDelivery> {
	if (!baseUrl) throw new Error("BESKID_TRACKER_API_URL is not configured");

	const response = await fetcher(latestDeliveryUrl(baseUrl));
	if (!response.ok)
		throw new Error(
			`Tracker latest delivery request failed (${response.status})`,
		);
	const payload = await response.json().catch(() => {
		throw malformedLatestDelivery();
	});

	if (
		!payload ||
		typeof payload !== "object" ||
		typeof (payload as { version?: unknown }).version !== "string" ||
		!semver.test((payload as { version: string }).version)
	) {
		throw malformedLatestDelivery();
	}

	const version = (payload as { version: string }).version;
	return { version, downloadLabel: `Beskid ${version}` };
}
