export interface PlaygroundHandoff {
	code: string;
	openPlayground: boolean;
}

/** Read code supplied by the public website's “Try in playground” link. */
export function readPlaygroundHandoff(search: string): PlaygroundHandoff {
	const code = new URLSearchParams(search).get("code") ?? "";
	return { code, openPlayground: code.length > 0 };
}
