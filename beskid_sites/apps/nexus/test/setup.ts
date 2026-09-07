import { beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);

function createMemoryStorage(): Storage {
	const store = new Map<string, string>();
	return {
		get length() {
			return store.size;
		},
		clear: () => store.clear(),
		getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
		key: (index: number) => [...store.keys()][index] ?? null,
		removeItem: (key: string) => {
			store.delete(key);
		},
		setItem: (key: string, value: string) => {
			store.set(key, value);
		},
	};
}

if (typeof globalThis.localStorage === "undefined") {
	globalThis.localStorage = createMemoryStorage();
}

// Reset storage between tests
beforeEach(() => {
	try {
		sessionStorage.removeItem("gitnexus-llm-settings");
		localStorage.removeItem("gitnexus-llm-settings"); // legacy key (migration)
	} catch {
		// ignore
	}
});
