import {
	AUTH_APP_IDS,
	AUTH_APP_META,
	type AuthAppId,
} from "@beskid/auth-client";

/** Fail-closed label when meta is missing or out of date vs app id. */
export function authAppLabel(appId: string): string {
	return AUTH_APP_META[appId as AuthAppId]?.label ?? appId;
}

/** Fail-closed description when meta is missing. */
export function authAppDescription(appId: string): string {
	return AUTH_APP_META[appId as AuthAppId]?.description ?? "";
}

/**
 * Pairing select options derived from the auth-client catalog.
 * Skips ids that have no meta entry so the form never reads `.label` on undefined.
 */
export function pairingAppOptions(): Array<{ id: AuthAppId; label: string }> {
	const options: Array<{ id: AuthAppId; label: string }> = [];
	for (const id of AUTH_APP_IDS) {
		const meta = AUTH_APP_META[id];
		if (!meta) continue;
		options.push({ id, label: meta.label });
	}
	return options;
}

export function defaultPairingAppId(
	options: Array<{ id: AuthAppId }> = pairingAppOptions(),
): AuthAppId {
	return options[0]?.id ?? "tracker";
}
