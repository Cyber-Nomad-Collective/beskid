export interface PackageSummary {
	id: string;
	name: string;
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
	githubLogin: string;
	hubSessionId: string;
}

export interface PublishPackageInput {
	packageName: string;
	version: string;
	artifact: File;
}

export interface PublishedPackageVersion {
	version: string;
}

export interface BootstrapStatus {
	hasUsers: boolean;
}

export interface AuthHubPairingStatus {
	paired: boolean;
	defaultPublicUrl: string;
	hubAvailable: boolean;
	appRegistered: boolean;
}

export interface PairAuthHubInput {
	code: string;
	publicUrl: string;
}

export interface PairAuthHubResult {
	ok: boolean;
	alreadyPaired: boolean;
}

export interface EmailSettings {
	smtpHost: string | null;
	smtpPort: number;
	enableSsl: boolean;
	username: string | null;
	password: string | null;
	fromEmail: string;
	fromName: string;
}

export interface EmailSettingsUpdate {
	smtpHost: string | null;
	smtpPort: number;
	enableSsl: boolean;
	username: string | null;
	password: string | null;
	fromEmail: string;
	fromName: string;
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
	githubLogin: string;
	roles: string[];
	publisherVerified: boolean;
}

export interface UpdateAdminUserInput {
	roles: string[];
	publisherVerified: boolean;
}

export interface AdminPermission {
	subject: string;
	resource: string;
	capability: string;
}

export interface CommunityProfile {
	subject: string;
	display_name: string;
	bio: string;
	social_links: string[];
}

export interface Notification {
	id: string;
	recipient: string;
	scope: string;
	actor: string;
	post_id: number | null;
	comment_id: number | null;
	is_read: boolean;
}

export interface CommunityBoard {
	id: string;
	title: string;
	locked: boolean;
}
export interface CommunityPost {
	id: number;
	board_id: string;
	author: string;
	title: string;
	content: string;
	score: number;
}
export interface CommunityComment {
	id: number;
	post_id: number;
	author: string;
	content: string;
	parent_comment_id: number | null;
	score: number;
}
export interface FollowState {
	is_following: boolean;
	changed: boolean;
}
export interface VoteResult {
	score: number;
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

	async listPublishers(): Promise<CommunityProfile[]> {
		return this.get<CommunityProfile[]>("/api/publishers");
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

	async publishPackage(
		input: PublishPackageInput,
	): Promise<PublishedPackageVersion> {
		const packageName = encodeURIComponent(input.packageName);
		const version = input.version.trim();
		return this.readJson<PublishedPackageVersion>(
			await this.request(
				`/api/packages/${packageName}/versions/${encodeURIComponent(version)}/artifact`,
				{
					method: "POST",
					headers: { "Content-Type": input.artifact.type || "application/zip" },
					body: input.artifact,
				},
			),
		);
	}

	async getCommunityProfile(subject: string): Promise<CommunityProfile> {
		return this.get<CommunityProfile>(
			`/api/community/profiles/${encodeURIComponent(subject)}`,
		);
	}

	async getBootstrapStatus(): Promise<BootstrapStatus> {
		return this.get<BootstrapStatus>("/users/bootstrap-status");
	}

	async getAuthHubPairingStatus(): Promise<AuthHubPairingStatus> {
		return this.get<AuthHubPairingStatus>("/api/auth/hub/pairing-status");
	}

	async pairWithAuthHub(input: PairAuthHubInput): Promise<PairAuthHubResult> {
		return this.readJson<PairAuthHubResult>(
			await this.request("/api/auth/hub/pair", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
	}

	async getEmailSettings(): Promise<EmailSettings> {
		return this.get<EmailSettings>("/api/admin/email-settings");
	}

	async updateEmailSettings(input: EmailSettingsUpdate): Promise<void> {
		const response = await this.request("/api/admin/email-settings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new PckgApiError(response.status);
	}

	async listRegistryActivity(take = 200): Promise<RegistryActivityEntry[]> {
		return this.get<RegistryActivityEntry[]>(
			`/api/admin/registry-activity?take=${encodeURIComponent(String(take))}`,
		);
	}

	async listBlockedLinks(): Promise<BlockedLink[]> {
		return this.get<BlockedLink[]>("/api/admin/blocked-links");
	}

	async addBlockedLink(input: AddBlockedLinkInput): Promise<AddBlockedLinkResult> {
		return this.postJson<AddBlockedLinkResult>("/api/admin/blocked-links", input);
	}

	async deleteBlockedLink(id: string): Promise<void> {
		const response = await this.request(
			`/api/admin/blocked-links/${encodeURIComponent(id)}`,
			{ method: "DELETE" },
		);
		if (!response.ok) throw new PckgApiError(response.status);
	}

	async updateMyCommunityProfile(
		input: Pick<CommunityProfile, "display_name" | "bio" | "social_links">,
	): Promise<CommunityProfile> {
		return this.readJson<CommunityProfile>(
			await this.request("/api/community/profiles/me", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					displayName: input.display_name,
					bio: input.bio,
					socialLinks: input.social_links,
				}),
			}),
		);
	}

	async listNotifications(): Promise<Notification[]> {
		return this.get<Notification[]>("/api/community/notifications");
	}

	async updateNotificationPreference(
		mode: "all" | "mentionsOnly",
	): Promise<void> {
		const response = await this.request(
			"/api/community/notification-preferences",
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mode }),
			},
		);
		if (!response.ok) throw new PckgApiError(response.status);
	}

	async listBoards(): Promise<CommunityBoard[]> {
		return this.get<CommunityBoard[]>("/api/community/boards");
	}
	async getBoard(boardId: string): Promise<CommunityBoard> {
		return this.get<CommunityBoard>(
			`/api/community/boards/${encodeURIComponent(boardId)}`,
		);
	}
	async listBoardPosts(boardId: string): Promise<CommunityPost[]> {
		return this.get<CommunityPost[]>(
			`/api/community/boards/${encodeURIComponent(boardId)}/posts`,
		);
	}
	async setBoardLocked(boardId: string, locked: boolean): Promise<void> {
		const response = await this.request(
			`/api/community/boards/${encodeURIComponent(boardId)}/moderation/lock`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ locked }),
			},
		);
		if (!response.ok) throw new PckgApiError(response.status);
	}
	async getPost(postId: number): Promise<CommunityPost> {
		return this.get<CommunityPost>(`/api/community/boards/posts/${postId}`);
	}
	async listPostComments(postId: number): Promise<CommunityComment[]> {
		return this.get<CommunityComment[]>(
			`/api/community/boards/posts/${postId}/comments`,
		);
	}

	async togglePublisherFollow(subject: string): Promise<FollowState> {
		return this.readJson<FollowState>(
			await this.request(
				`/api/community/publisher-follows/${encodeURIComponent(subject)}/toggle`,
				{ method: "POST" },
			),
		);
	}

	async createPost(
		boardId: string,
		input: { title: string; content: string },
	): Promise<CommunityPost> {
		return this.postJson<CommunityPost>(
			`/api/community/boards/${encodeURIComponent(boardId)}/posts`,
			input,
		);
	}

	async createComment(
		postId: number,
		input: { content: string; parentCommentId?: number },
	): Promise<CommunityComment> {
		return this.postJson<CommunityComment>(
			`/api/community/boards/posts/${postId}/comments`,
			input,
		);
	}

	async voteOnPost(postId: number, value: -1 | 0 | 1): Promise<VoteResult> {
		return this.postJson<VoteResult>(
			`/api/community/boards/posts/${postId}/vote`,
			{ value },
		);
	}
	async voteOnComment(
		commentId: number,
		value: -1 | 0 | 1,
	): Promise<VoteResult> {
		return this.postJson<VoteResult>(
			`/api/community/boards/comments/${commentId}/vote`,
			{ value },
		);
	}
	async markNotificationRead(notificationId: string): Promise<void> {
		const response = await this.request(
			`/api/community/notifications/${notificationId}/read`,
			{ method: "POST" },
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
