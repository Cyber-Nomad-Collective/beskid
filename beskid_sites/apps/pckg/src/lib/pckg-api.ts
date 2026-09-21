export type PackageKind = "library" | "template" | "tool";

export interface PackageTemplateSummary {
	shortName?: string;
	tags?: {
		type?: string;
		classifications?: string[];
	};
}

export interface PackageSummary {
	id: string;
	name: string;
	packageKind: PackageKind;
	template: PackageTemplateSummary | null;
	description: string;
	category: string;
	repositoryUrl: string | null;
	websiteUrl: string | null;
	tags: string[];
	totalDownloads: number;
	updatedAtUtc: string;
	ownerDisplayName: string;
}

export interface PackageVersion {
	id: string;
	version: string;
	publishedAtUtc: string;
	isYanked: boolean;
	checksumSha256: string;
	sizeBytes: number;
	hasReadme: boolean;
}

export interface PackageDetails {
	package: PackageSummary;
	versions: PackageVersion[];
	dependencies: Array<{
		name: string;
		version: string | null;
		source: string;
		registry: string | null;
	}>;
	dependentsCount: number;
	readme: string | null;
	latestVersion: string | null;
	latestDownloadUrl: string | null;
}

export interface PackageBrowseEntry {
	path: string;
	sizeBytes: number;
}

export interface StructuredPackageDocs {
	readme: string | null;
	metadata: unknown | null;
}

export interface Session {
	subject: string;
	email: string | null;
	displayName: string | null;
	groups: string[];
}

export interface RegistryActivityEntry {
	timestampUtc: string;
	severity: string;
	action: string;
	message: string;
	traceId: string | null;
	userId: string | null;
	packageName: string | null;
	version: string | null;
}

export interface BlockedLink {
	id: string;
	pattern: string;
	note: string | null;
	createdAtUtc: string;
}

export interface AddBlockedLinkInput {
	pattern: string;
	note?: string;
}

export interface AddBlockedLinkResult {
	success: boolean;
	message: string;
	item: BlockedLink | null;
}

export interface SearchPackagesInput {
	query?: string;
	owner?: "me";
}

export interface ApiKey {
	id: string;
	name: string;
	prefix: string;
	scopes: string[];
	createdAtUtc: string;
	revokedAtUtc: string | null;
}

export interface CreatedApiKey {
	key: ApiKey;
	plainTextKey: string;
}

export interface AdminUser {
	subject: string;
	displayName: string;
	publisherVerified: boolean;
}

export interface UpdateAdminUserInput {
	publisherVerified: boolean;
}

export interface AdminPermission {
	subject: string;
	resource: string;
	capability: string;
}

export interface PublisherSummary {
	subject: string;
	displayName: string;
	isPublisherVerified: boolean;
	packageCount: number;
}
export interface PackageCommunityReview {
	id: string;
	author: string;
	rating: number;
	comment: string;
	createdAtUtc: string;
}

export class PckgApiClient {
	private readonly fetch: typeof globalThis.fetch;
	private readonly baseUrl: string;

	constructor(
		options: { fetch?: typeof globalThis.fetch; baseUrl?: string } = {},
	) {
		this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
		this.baseUrl =
			options.baseUrl ?? globalThis.location?.origin ?? "http://localhost";
	}

	async listPackages(
		input: SearchPackagesInput = {},
	): Promise<PackageSummary[]> {
		const query = input.query?.trim();
		if (input.owner === "me")
			return this.get<PackageSummary[]>("/api/packages?owner=me");
		if (!query) return this.get<PackageSummary[]>("/api/packages");
		const results = await this.get<Array<{ package: PackageSummary }>>(
			`/api/search?q=${encodeURIComponent(query)}`,
		);
		return results.map((result) => result.package);
	}

	async listPublishers(): Promise<PublisherSummary[]> {
		return this.get<PublisherSummary[]>("/api/publishers");
	}

	async listPublisherPackages(subject: string): Promise<PackageSummary[]> {
		return this.get<PackageSummary[]>(
			`/api/publishers/${encodeURIComponent(subject)}/packages`,
		);
	}

	async listApiKeys(): Promise<ApiKey[]> {
		return this.get<ApiKey[]>("/api/api-keys");
	}

	async createApiKey(input: {
		name: string;
		scopes: string[];
	}): Promise<CreatedApiKey> {
		return this.postJson<CreatedApiKey>("/api/api-keys", input);
	}

	async revokeApiKey(keyId: string): Promise<void> {
		const response = await this.request(
			`/api/api-keys/${encodeURIComponent(keyId)}`,
			{ method: "DELETE" },
		);
		if (!response.ok) throw new PckgApiError(response.status);
	}

	async listAdminUsers(): Promise<AdminUser[]> {
		return this.get<AdminUser[]>("/api/admin/users");
	}

	async updateAdminUser(
		subject: string,
		input: UpdateAdminUserInput,
	): Promise<AdminUser> {
		return this.readJson<AdminUser>(
			await this.request(`/api/admin/users/${encodeURIComponent(subject)}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
	}

	async listAdminPermissions(): Promise<AdminPermission[]> {
		return this.get<AdminPermission[]>("/api/admin/permissions");
	}

	async grantAdminPermission(input: AdminPermission): Promise<AdminPermission> {
		return this.postJson<AdminPermission>("/api/admin/permissions", input);
	}

	async getPackage(packageName: string): Promise<PackageDetails> {
		const details = await this.get<Omit<PackageDetails, "latestDownloadUrl">>(
			`/api/packages/${encodeURIComponent(packageName)}`,
		);
		return {
			...details,
			latestDownloadUrl: details.latestVersion
				? this.packageDownloadUrl(packageName, "latest")
				: null,
		};
	}
	async listPackageCommunityReviews(
		packageName: string,
	): Promise<PackageCommunityReview[]> {
		return this.get<PackageCommunityReview[]>(
			`/api/packages/${encodeURIComponent(packageName)}/community-reviews`,
		);
	}
	async createPackageCommunityReview(
		packageName: string,
		input: { rating: number; comment: string },
	): Promise<PackageCommunityReview> {
		return this.postJson<PackageCommunityReview>(
			`/api/packages/${encodeURIComponent(packageName)}/community-reviews`,
			input,
		);
	}

	async getPackageReadme(packageName: string, version: string): Promise<string> {
		return this.getText(this.artifactPath(packageName, version, "readme"));
	}

	async listPackageDocs(
		packageName: string,
		version: string,
	): Promise<PackageBrowseEntry[]> {
		return this.get<PackageBrowseEntry[]>(
			this.artifactPath(packageName, version, "docs"),
		);
	}

	async getPackageDoc(
		packageName: string,
		version: string,
		path: string,
	): Promise<string> {
		return this.getText(
			`${this.artifactPath(packageName, version, "docs/file")}?path=${encodeURIComponent(path)}`,
		);
	}

	async getStructuredPackageDocs(
		packageName: string,
		version: string,
	): Promise<StructuredPackageDocs> {
		return this.get<StructuredPackageDocs>(
			this.artifactPath(packageName, version, "docs/structured"),
		);
	}

	async listPackageSource(
		packageName: string,
		version: string,
	): Promise<PackageBrowseEntry[]> {
		return this.get<PackageBrowseEntry[]>(
			this.artifactPath(packageName, version, "source/tree"),
		);
	}

	async getPackageSource(
		packageName: string,
		version: string,
		path: string,
	): Promise<string> {
		return this.getText(
			`${this.artifactPath(packageName, version, "source/file")}?path=${encodeURIComponent(path)}`,
		);
	}

	async getSession(): Promise<Session | null> {
		const response = await this.request("/api/auth/session");
		if (response.status === 401) return null;
		return this.readJson<Session>(response);
	}

	async listRegistryActivity(take = 200): Promise<RegistryActivityEntry[]> {
		return this.get<RegistryActivityEntry[]>(
			`/api/admin/registry-activity?take=${encodeURIComponent(String(take))}`,
		);
	}

	async listBlockedLinks(): Promise<BlockedLink[]> {
		return this.get<BlockedLink[]>("/api/admin/blocked-links");
	}

	async addBlockedLink(
		input: AddBlockedLinkInput,
	): Promise<AddBlockedLinkResult> {
		return this.postJson<AddBlockedLinkResult>("/api/admin/blocked-links", input);
	}

	async deleteBlockedLink(id: string): Promise<void> {
		const response = await this.request(
			`/api/admin/blocked-links/${encodeURIComponent(id)}`,
			{ method: "DELETE" },
		);
		if (!response.ok) throw new PckgApiError(response.status);
	}

	packageDownloadUrl(packageName: string, version: string): string {
		return `${this.baseUrl}/api/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(version)}/download`;
	}

	private async get<T>(path: string): Promise<T> {
		return this.readJson<T>(await this.request(path));
	}

	private async getText(path: string): Promise<string> {
		const response = await this.request(path);
		if (!response.ok) throw new PckgApiError(response.status);
		return response.text();
	}

	private async postJson<T>(path: string, body: unknown): Promise<T> {
		return this.readJson<T>(
			await this.request(path, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			}),
		);
	}

	private request(path: string, init?: RequestInit): Promise<Response> {
		return this.fetch(
			new Request(`${this.baseUrl}${path}`, { ...init, credentials: "include" }),
		);
	}

	private artifactPath(
		packageName: string,
		version: string,
		suffix: string,
	): string {
		return `/api/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(version)}/${suffix}`;
	}

	private async readJson<T>(response: Response): Promise<T> {
		if (!response.ok) throw new PckgApiError(response.status);
		return response.json() as Promise<T>;
	}
}

export class PckgApiError extends Error {
	constructor(readonly status: number) {
		super(`pckg API request failed with status ${status}`);
	}
}

export const pckgApi = new PckgApiClient();
