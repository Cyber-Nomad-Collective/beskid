import { describe, expect, it, vi } from "vitest";

import {
	createLspBridge,
	decodeLspFrames,
	encodeLspFrame,
	type LspSession,
	type LspSocket,
} from "./lspBridge";

describe("LSP framing", () => {
	it("round-trips a JSON-RPC payload with Content-Length framing", () => {
		const payload = '{"jsonrpc":"2.0","id":1,"result":{}}';

		expect(decodeLspFrames(encodeLspFrame(payload))).toEqual({
			messages: [payload],
			remainder: "",
		});
	});

	it("leaves an incomplete LSP frame buffered", () => {
		const encoded = encodeLspFrame('{"jsonrpc":"2.0","method":"initialized"}');

		expect(decodeLspFrames(encoded.slice(0, -1))).toEqual({
			messages: [],
			remainder: encoded.slice(0, -1),
		});
	});
});

describe("createLspBridge", () => {
	it("rejects an unauthenticated WebSocket upgrade before spawning the language server", async () => {
		const spawn = vi.fn();
		const bridge = createLspBridge({
			getSession: async () => null,
			spawn,
			createWorkspace: async () => "/tmp/unused",
			removeWorkspace: async () => undefined,
		});
		const server = { upgrade: vi.fn() };

		const response = await bridge.upgrade(new Request("https://learn.test/api/lsp"), server);

		expect(response?.status).toBe(401);
		expect(spawn).not.toHaveBeenCalled();
		expect(server.upgrade).not.toHaveBeenCalled();
	});

	it("forwards browser JSON-RPC to stdio and removes the workspace when the socket closes", async () => {
		const child = createChild();
		const removeWorkspace = vi.fn(async () => undefined);
		const bridge = createLspBridge({
			getSession: async () => ({ login: "miks" }),
			spawn: vi.fn(() => child),
			createWorkspace: async () => "/tmp/learn-lsp-test",
			removeWorkspace,
		});
		const socket: LspSocket = { send: vi.fn() };
		const server = {
			upgrade: vi.fn((_request: Request, options: { data: LspSession }) => {
				socket.data = options.data;
				return true;
			}),
		};

		expect(await bridge.upgrade(new Request("https://learn.test/api/lsp"), server)).toBeUndefined();
		expect(socket.data).toBeDefined();
		bridge.websocket.open(socket);
		bridge.websocket.message(socket, '{"jsonrpc":"2.0","method":"initialize","id":1}');
		expect(child.write).toHaveBeenCalledWith(expect.stringContaining("Content-Length:"));

		bridge.websocket.close(socket);
		await Promise.resolve();
		expect(child.kill).toHaveBeenCalledWith();
		expect(removeWorkspace).toHaveBeenCalledWith("/tmp/learn-lsp-test");
	});
});

function createChild() {
	return {
		write: vi.fn(),
		kill: vi.fn(),
		onStdout: vi.fn(),
		onExit: vi.fn(),
	};
}
