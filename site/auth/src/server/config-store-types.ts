import type { AuthAppId } from "@beskid/auth-client";

export interface StoredAuthApp {
	id: AuthAppId;
	publicUrl: string;
	enabled: boolean;
}

export interface AuthConfigFile {
	onboarded: boolean;
	githubClientId?: string;
	githubClientSecret?: string;
	githubOAuthCallbackUrl?: string;
	adminGitHubLogins: string[];
	apps: StoredAuthApp[];
}

export interface ResolvedOAuthConfig {
	clientId: string;
	clientSecret: string;
	callbackUrl: string;
	source: "env" | "db" | "none";
}
