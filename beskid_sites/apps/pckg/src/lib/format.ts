/**
 * Deterministic display formatting. Pages render on the server and hydrate in
 * the browser, so numbers and dates must not depend on either runtime's
 * locale or time zone; a mismatch makes React discard the server markup.
 */
const COUNT = new Intl.NumberFormat("en-GB");
const DATE = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	timeZone: "UTC",
	timeZoneName: "short",
});

export function formatCount(value: number): string {
	return COUNT.format(value);
}

/** `19 Sep 2026` */
export function formatDate(iso: string): string {
	return DATE.format(new Date(iso));
}

/** `19 Sep 2026, 14:05 UTC` */
export function formatDateTime(iso: string): string {
	return DATE_TIME.format(new Date(iso));
}
