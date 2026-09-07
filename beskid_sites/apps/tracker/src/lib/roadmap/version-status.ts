export const VERSION_STATUSES = ["Planned", "In Progress", "Released"] as const;

export type VersionStatus = (typeof VERSION_STATUSES)[number];

const DEFAULT_STATUS: VersionStatus = "Planned";

export function normalizeVersionStatus(
	status: VersionStatus | undefined,
): VersionStatus {
	if (status && VERSION_STATUSES.includes(status)) return status;
	return DEFAULT_STATUS;
}

export function versionStatusSlug(status: VersionStatus | undefined): string {
	return normalizeVersionStatus(status).replace(/\s+/g, "-").toLowerCase();
}

export function versionStatusLabel(status: VersionStatus | undefined): string {
	return normalizeVersionStatus(status);
}

export function versionStatusBadgeVariant(
	status: VersionStatus | undefined,
): "default" | "secondary" | "outline" {
	switch (normalizeVersionStatus(status)) {
		case "Released":
			return "default";
		case "In Progress":
			return "secondary";
		default:
			return "outline";
	}
}
