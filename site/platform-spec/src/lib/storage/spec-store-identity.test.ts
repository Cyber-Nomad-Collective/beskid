import { describe, expect, it } from "vitest";

import { specStoreDocumentKey } from "#/lib/storage/spec-store-identity";

describe("specStoreDocumentKey", () => {
	it("keeps a feature and its informative documents in separate rows", () => {
		const feature = {
			key: "compiler--front-end--parser",
			capability: "compiler--front-end--parser",
		};
		const article = {
			key: "compiler--front-end--parser--article--grammar-notes",
			capability: "compiler--front-end--parser",
		};

		expect(specStoreDocumentKey(feature)).not.toBe(
			specStoreDocumentKey(article),
		);
	});
});
