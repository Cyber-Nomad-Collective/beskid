import { Buffer } from "node:buffer";

const FRAME_SEPARATOR = "\r\n\r\n";
const MAX_MESSAGE_BYTES = 1024 * 1024;

export type LspSocket = {
	send(message: string): void;
	data?: LspSession;
};

export type LspSession = {
	child: LspChild;
	workspace: string;
	socket?: LspSocket;
	buffer: string;
	closed: boolean;
};

export type LspChild = {
	write(message: string): void;
	kill(): void;
	onStdout(listener: (chunk: string) => void): void;
	onExit(listener: () => void): void;
};

export type LspBridgeOptions = {
	getSession(request: Request): Promise<unknown | null>;
	spawn(workspace: string): LspChild;
	createWorkspace(): Promise<string>;
	removeWorkspace(workspace: string): Promise<void>;
};

type UpgradeServer = {
	upgrade(request: Request, options: { data: LspSession }): boolean;
};

export type LspBridge = {
	upgrade(request: Request, server: UpgradeServer): Promise<Response | undefined>;
	websocket: {
		open(socket: LspSocket): void;
		message(socket: LspSocket, message: string | ArrayBufferView): void;
		close(socket: LspSocket): void;
	};
	shutdown(): Promise<void>;
};

export function encodeLspFrame(payload: string): string {
	return `Content-Length: ${Buffer.byteLength(payload, "utf8")}${FRAME_SEPARATOR}${payload}`;
}

export function decodeLspFrames(buffer: string): { messages: string[]; remainder: string } {
	const messages: string[] = [];
	let remaining = buffer;

	while (remaining.length > 0) {
		const separatorIndex = remaining.indexOf(FRAME_SEPARATOR);
		if (separatorIndex < 0) break;

		const header = remaining.slice(0, separatorIndex);
		const length = parseContentLength(header);
		if (length === null || length > MAX_MESSAGE_BYTES) {
			throw new Error("Invalid LSP Content-Length");
		}

		const payloadStart = Buffer.byteLength(remaining.slice(0, separatorIndex + FRAME_SEPARATOR.length), "utf8");
		const source = Buffer.from(remaining, "utf8");
		if (source.length < payloadStart + length) break;

		messages.push(source.subarray(payloadStart, payloadStart + length).toString("utf8"));
		remaining = source.subarray(payloadStart + length).toString("utf8");
	}

	return { messages, remainder: remaining };
}

function parseContentLength(header: string): number | null {
	for (const line of header.split("\r\n")) {
		const match = /^Content-Length:\s*(\d+)\s*$/i.exec(line);
		if (match) return Number(match[1]);
	}
	return null;
}

export function createLspBridge(options: LspBridgeOptions): LspBridge {
	const sessions = new Set<LspSession>();

	async function close(session: LspSession): Promise<void> {
		if (session.closed) return;
		session.closed = true;
		sessions.delete(session);
		try {
			session.child.kill();
		} finally {
			await options.removeWorkspace(session.workspace);
		}
	}

	function receiveStdout(session: LspSession, chunk: string) {
		if (session.closed) return;
		try {
			const decoded = decodeLspFrames(session.buffer + chunk);
			session.buffer = decoded.remainder;
			for (const message of decoded.messages) session.socket?.send(message);
		} catch {
			void close(session);
		}
	}

	return {
		async upgrade(request, server) {
			if (!(await options.getSession(request))) {
				return Response.json({ error: "Authentication required" }, { status: 401 });
			}

			let workspace: string | undefined;
			try {
				workspace = await options.createWorkspace();
				const child = options.spawn(workspace);
				const session: LspSession = { child, workspace, buffer: "", closed: false };
				child.onStdout((chunk) => receiveStdout(session, chunk));
				child.onExit(() => void close(session));
				if (!server.upgrade(request, { data: session })) {
					await close(session);
					return Response.json({ error: "Language service unavailable" }, { status: 503 });
				}
				sessions.add(session);
				return undefined;
			} catch {
				if (workspace) await options.removeWorkspace(workspace);
				return Response.json({ error: "Language service unavailable" }, { status: 503 });
			}
		},
		websocket: {
			open(socket) {
				const session = socket.data;
				if (session) session.socket = socket;
			},
			message(socket, message) {
				const session = socket.data;
				if (!session || session.closed) return;
				const text = typeof message === "string" ? message : Buffer.from(message.buffer).toString("utf8");
				if (Buffer.byteLength(text, "utf8") > MAX_MESSAGE_BYTES) {
					void close(session);
					return;
				}
				session.child.write(encodeLspFrame(text));
			},
			close(socket) {
				if (socket.data) void close(socket.data);
			},
		},
		async shutdown() {
			await Promise.all([...sessions].map((session) => close(session)));
		},
	};
}
