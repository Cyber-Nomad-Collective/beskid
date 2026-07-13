import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "#/components/ui-primitives";
import { useState } from "react";

export interface AuthHubSetupDefaults {
	defaultAuthHubUrl: string;
	defaultPlatformSpecPublicUrl: string;
	storedApproverLogin: string;
	hasSessionSecret: boolean;
	hasSetupToken: boolean;
}

interface AuthHubSetupWizardProps extends AuthHubSetupDefaults {
	onComplete: () => void;
}

export function AuthHubSetupWizard({
	defaultAuthHubUrl,
	defaultPlatformSpecPublicUrl,
	storedApproverLogin,
	hasSessionSecret,
	hasSetupToken,
	onComplete,
}: AuthHubSetupWizardProps) {
	const [authHubPublicUrl, setAuthHubPublicUrl] = useState(defaultAuthHubUrl);
	const [pairingCode, setPairingCode] = useState("");
	const [platformSpecPublicUrl, setPlatformSpecPublicUrl] = useState(
		defaultPlatformSpecPublicUrl,
	);
	const [approverLogin, setApproverLogin] = useState(storedApproverLogin);
	const [setupToken, setSetupToken] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		setBusy(true);
		try {
			const res = await fetch("/api/admin/setup", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					authHubPublicUrl: authHubPublicUrl.trim() || undefined,
					pairingCode: pairingCode.trim(),
					platformSpecPublicUrl: platformSpecPublicUrl.trim(),
					approverLogin: approverLogin.trim(),
					setupToken: setupToken.trim() || undefined,
				}),
			});
			const body = (await res.json().catch(() => ({}))) as { error?: string };
			if (!res.ok) {
				throw new Error(body.error || "Setup failed");
			}
			onComplete();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Setup failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Card className="mx-auto w-full max-w-lg">
			<CardHeader className="text-center">
				<CardTitle className="text-xl">Connect Beskid Auth</CardTitle>
				<CardDescription>
					Platform Spec signs in through the shared auth hub. On the hub, open{" "}
					<strong>Admin → Pairing</strong>, create a code for app{" "}
					<code className="text-xs">platform-spec</code>, then enter it below.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!hasSessionSecret ? (
					<p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						Set <code className="text-xs">SESSION_SECRET</code> (32+ characters)
						before pairing.
					</p>
				) : null}

				<form className="space-y-4" onSubmit={onSubmit}>
					<div className="space-y-2">
						<Label htmlFor="authHubPublicUrl">Auth hub URL</Label>
						<Input
							id="authHubPublicUrl"
							type="url"
							required
							value={authHubPublicUrl}
							onChange={(e) => setAuthHubPublicUrl(e.target.value)}
							placeholder="https://auth.beskid-lang.org"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="pairingCode">Pairing code (from auth hub admin)</Label>
						<Input
							id="pairingCode"
							required
							value={pairingCode}
							onChange={(e) => setPairingCode(e.target.value)}
							className="font-mono"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="platformSpecPublicUrl">This service public URL</Label>
						<Input
							id="platformSpecPublicUrl"
							type="url"
							required
							value={platformSpecPublicUrl}
							onChange={(e) => setPlatformSpecPublicUrl(e.target.value)}
							className="font-mono text-xs"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="approverLogin">Your GitHub login (pairing approver)</Label>
						<Input
							id="approverLogin"
							required
							value={approverLogin}
							onChange={(e) => setApproverLogin(e.target.value)}
						/>
					</div>
					{hasSetupToken ? (
						<div className="space-y-2">
							<Label htmlFor="setupToken">Setup token</Label>
							<Input
								id="setupToken"
								type="password"
								value={setupToken}
								onChange={(e) => setSetupToken(e.target.value)}
							/>
						</div>
					) : null}

					{error ? (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					) : null}

					<Button type="submit" className="w-full" disabled={busy || !hasSessionSecret}>
						{busy ? "Saving…" : "Save and pair with auth hub"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
