export interface TrackerSpecLink {
	standardId: string;
	catalogRevision: string;
	relation: "implements" | "verifies" | "blocks" | "relates";
}

export interface DeliveryVersion {
	id: string;
	status: "Planned" | "In Progress" | "Released";
	visibility: "public" | "private";
	catalogRevision: string;
}

export interface DeliveryLatest {
	version: DeliveryVersion;
	publishedAt: string;
}

export type TypedLinkTarget =
	| {
			kind: "tracker-version";
			versionId: string;
	  }
	| {
			kind: "tracker-task";
			versionId: string;
			taskId: string;
	  }
	| {
			kind: "openspec";
			standardId: string;
			catalogRevision: string;
	  }
	| {
			kind: "github-bug";
			repository: string;
			issueNumber: number;
	  };

export function assertTrackerSpecLink(
	link: Pick<TrackerSpecLink, "standardId" | "catalogRevision">,
): void {
	if (!link.standardId || !link.catalogRevision) {
		throw new Error("OpenSpec link requires standardId and catalogRevision");
	}
}

export function isPublicDeliveryVersion(
	version: Pick<DeliveryVersion, "status" | "visibility">,
): boolean {
	return version.status === "Released" && version.visibility === "public";
}
