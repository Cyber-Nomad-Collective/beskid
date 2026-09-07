import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConnectMcpDialog } from "../../src/components/connect-mcp-dialog";

vi.mock("@cyber-nomad-collective/beskid-ui-react/ui/dialog", () => ({
	Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
		open ? <div data-testid="dialog">{children}</div> : null,
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h2>{children}</h2>
	),
	DialogDescription: ({ children }: { children: React.ReactNode }) => (
		<p>{children}</p>
	),
}));

vi.mock("@cyber-nomad-collective/beskid-ui-react/ui/button", () => ({
	Button: ({
		children,
		onClick,
		title,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		title?: string;
	}) => (
		<button type="button" onClick={onClick} title={title}>
			{children}
		</button>
	),
}));

vi.mock("@cyber-nomad-collective/beskid-ui-react/ui/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} readOnly />
	),
}));

describe("ConnectMcpDialog", () => {
	it("renders MCP endpoint from origin", () => {
		render(
			<ConnectMcpDialog
				open
				onOpenChange={() => {}}
				mcpUrl="https://nexus.example/api/mcp"
			/>,
		);
		expect(
			screen.getByDisplayValue("https://nexus.example/api/mcp"),
		).toBeInTheDocument();
	});
});
