import type { TrackerBug } from "#/lib/tracker/types";

export function isBugInGithubSyncScope(_bug: Pick<TrackerBug, "id">): boolean {
	return true;
}
