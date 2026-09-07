import { Button } from "@cyber-nomad-collective/beskid-ui-react/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/dialog";
import { Input } from "@cyber-nomad-collective/beskid-ui-react/ui/input";
import { useCallback, useState } from "react";
import { Check, Copy } from "@/lib/lucide-icons";

const AUTH_HEADER_TEMPLATE = "Authorization: Bearer <NEXUS_MCP_AUTH_TOKEN>";

export interface ConnectMcpDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mcpUrl: string;
	docsHref?: string;
}

export function ConnectMcpDialog({
	open,
	onOpenChange,
	mcpUrl,
	docsHref = "/platform-spec/tooling/nexus/contracts-and-edge-cases#mcp",
}: ConnectMcpDialogProps) {
	const [copiedField, setCopiedField] = useState<"url" | "auth" | null>(null);

	const copyText = useCallback(async (text: string, field: "url" | "auth") => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			window.setTimeout(() => setCopiedField(null), 2000);
		} catch {
			// ignore clipboard failures
		}
	}, []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Connect MCP</DialogTitle>
					<DialogDescription>
						Use this Streamable HTTP endpoint from an MCP client. Authentication uses
						a deployment secret — ask your operator or copy from Coolify env.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="mcp-endpoint">
							Endpoint
						</label>
						<div className="flex gap-2">
							<Input
								id="mcp-endpoint"
								readOnly
								value={mcpUrl}
								className="font-mono text-xs"
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								title="Copy endpoint URL"
								onClick={() => void copyText(mcpUrl, "url")}
							>
								{copiedField === "url" ? (
									<Check className="size-4" />
								) : (
									<Copy className="size-4" />
								)}
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="mcp-auth-header">
							Authorization header
						</label>
						<div className="flex gap-2">
							<Input
								id="mcp-auth-header"
								readOnly
								value={AUTH_HEADER_TEMPLATE}
								className="font-mono text-xs"
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								title="Copy authorization header"
								onClick={() => void copyText(AUTH_HEADER_TEMPLATE, "auth")}
							>
								{copiedField === "auth" ? (
									<Check className="size-4" />
								) : (
									<Copy className="size-4" />
								)}
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Replace <code className="font-mono">&lt;NEXUS_MCP_AUTH_TOKEN&gt;</code>{" "}
							with the value from your Nexus deployment environment.
						</p>
					</div>

					<p className="text-sm">
						<a
							href={docsHref}
							className="text-primary underline-offset-2 hover:underline"
						>
							Platform spec: MCP connect
						</a>
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
