import { useState } from "react";
import { Sparkles } from "@/lib/lucide-icons";
import { submitAuthHubSetup } from "../services/nexus-api";

interface OAuthSetupWizardProps {
	onComplete: () => void;
}

export function OAuthSetupWizard({ onComplete }: OAuthSetupWizardProps) {
	const [authHubPublicUrl, setAuthHubPublicUrl] = useState("");
	const [pairingCode, setPairingCode] = useState("");
	const [nexusPublicUrl, setNexusPublicUrl] = useState(
		() => window.location.origin,
	);
	const [ownerLogin, setOwnerLogin] = useState("");
	const [adminLogins, setAdminLogins] = useState("");
	const [setupToken, setSetupToken] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSaving(true);
		try {
			await submitAuthHubSetup({
				authHubPublicUrl: authHubPublicUrl || undefined,
				pairingCode,
				nexusPublicUrl,
				ownerLogin,
				adminLogins: adminLogins || ownerLogin,
				setupToken: setupToken || undefined,
			});
			onComplete();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Setup failed");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="relative mx-auto max-w-lg animate-fade-in overflow-hidden rounded-3xl border border-border bg-card p-7">
			<div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-primary/6 blur-3xl" />
			<div className="relative mb-6 text-center">
				<Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
				<h1 className="text-lg font-semibold text-foreground">
					Connect Beskid Auth
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Nexus signs in through the shared{" "}
					<a
						className="text-primary underline"
						href="https://github.com/Cyber-Nomad-Collective/beskid/tree/main/site/auth"
						rel="noreferrer"
						target="_blank"
					>
						auth hub
					</a>
					. On the hub, open <strong>Admin → Pairing</strong>, create a code for app{" "}
					<code className="text-primary">nexus</code>, then enter it below. The
					server also needs <code className="text-primary">SESSION_SECRET</code> (32+
					characters) in the environment.
				</p>
			</div>
			<form onSubmit={handleSubmit} className="relative space-y-4">
				<label className="block text-sm">
					<span className="text-muted-foreground">Auth hub URL</span>
					<input
						required
						value={authHubPublicUrl}
						onChange={(e) => setAuthHubPublicUrl(e.target.value)}
						placeholder="https://auth.beskid-lang.org"
						className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
				</label>
				<label className="block text-sm">
					<span className="text-muted-foreground">
						Pairing code (from auth hub admin)
					</span>
					<input
						required
						value={pairingCode}
						onChange={(e) => setPairingCode(e.target.value)}
						className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
					/>
				</label>
				<label className="block text-sm">
					<span className="text-muted-foreground">This Nexus public URL</span>
					<input
						required
						value={nexusPublicUrl}
						onChange={(e) => setNexusPublicUrl(e.target.value)}
						className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
					/>
				</label>
				<label className="block text-sm">
					<span className="text-muted-foreground">
						Your GitHub login (first admin)
					</span>
					<input
						required
						value={ownerLogin}
						onChange={(e) => setOwnerLogin(e.target.value)}
						className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
				</label>
				<label className="block text-sm">
					<span className="text-muted-foreground">
						Additional admin logins (comma-separated)
					</span>
					<input
						value={adminLogins}
						onChange={(e) => setAdminLogins(e.target.value)}
						placeholder="optional"
						className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
				</label>
				<label className="block text-sm">
					<span className="text-muted-foreground">
						Setup token (if NEXUS_SETUP_TOKEN is set on server)
					</span>
					<input
						value={setupToken}
						onChange={(e) => setSetupToken(e.target.value)}
						type="password"
						className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
				</label>
				{error && <p className="text-sm text-red-400">{error}</p>}
				<button
					type="submit"
					disabled={saving}
					className="w-full cursor-pointer rounded-lg bg-primary/10 py-2.5 text-sm font-medium text-white disabled:opacity-50"
				>
					{saving ? "Saving…" : "Save and pair with auth hub"}
				</button>
			</form>
		</div>
	);
}
