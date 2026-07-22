export interface SpecStoreDocumentIdentity {
	key: string;
	capability: string;
}

export function specStoreDocumentKey(
	document: SpecStoreDocumentIdentity,
): string {
	return document.key;
}
