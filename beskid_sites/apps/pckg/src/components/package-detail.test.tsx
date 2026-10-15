import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PackageDetails } from "#/lib/pckg-api";
import { PackageDetail } from "./package-detail";

// Link from @tanstack/react-router is mocked in test-setup to render <a>.
vi.mock("@tanstack/react-router", () => ({
	Link: ({
		to,
		children,
		...rest
	}: {
		to?: string;
		children?: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={to ?? "#"} {...(rest as Record<string, unknown>)}>
			{children}
		</a>
	),
	useRouterState: () => ({ location: { pathname: "/" } }),
	useRouteContext: () => ({ user: null }),
	useNavigate: () => () => {},
}));

const details: PackageDetails = {
	package: {
		id: "1",
		name: "beskid.http",
		packageKind: "library",
		template: null,
		description: "HTTP client for Beskid.",
		category: "network",
		repositoryUrl: "https://github.com/x/beskid.http",
		websiteUrl: "https://beskid-lang.org",
		tags: ["http", "client"],
		totalDownloads: 4242,
		updatedAtUtc: "2026-01-02T00:00:00Z",
		ownerDisplayName: "octocat",
		community: {
			url: "https://community.beskid-lang.org/topic/12/beskid-http",
			topicId: 12,
			topicSlug: "12/beskid-http",
		},
	},
	versions: [
		{
			id: "v1",
			version: "1.2.3",
			publishedAtUtc: "2026-01-02T00:00:00Z",
			isYanked: false,
			checksumSha256: "abc123",
			sizeBytes: 2048,
			hasReadme: true,
		},
	],
	dependencies: [
		{
			name: "beskid.core",
			version: "0.1.0",
			source: "registry",
			registry: "pckg",
		},
	],
	dependentsCount: 7,
	readme: "# beskid.http\nA client.",
	latestVersion: "1.2.3",
	latestDownloadUrl:
		"http://localhost/api/packages/beskid.http/versions/latest/download",
};

describe("PackageDetail", () => {
	it("renders the hero, facts, readme, dependencies, and versions", () => {
		render(
			<PackageDetail
				details={details}
				community={{
					url: "https://community.beskid-lang.org/topic/12/beskid-http",
					topicId: 12,
					topicSlug: "12/beskid-http",
					replyCount: 2,
					viewCount: 57,
					recentPosts: [
						{
							pid: 900,
							author: "octocat",
							postedAtUtc: "2026-10-09T08:53:20Z",
							excerpt: "Version 1.2.3 of beskid.http was published.",
							url: "https://community.beskid-lang.org/post/900",
						},
					],
				}}
			/>,
		);

		// Hero
		expect(screen.getAllByText("beskid.http").length).toBeGreaterThan(0);
		expect(screen.getByText("HTTP client for Beskid.")).toBeInTheDocument();
		expect(screen.getByText(/Download latest/)).toBeInTheDocument();
		expect(screen.getByText("Documentation")).toBeInTheDocument();
		expect(screen.getByText("Browse files")).toBeInTheDocument();
		const discuss = screen.getByText(/Discuss on the forum/).closest("a");
		expect(discuss).toHaveAttribute(
			"href",
			"https://community.beskid-lang.org/topic/12/beskid-http",
		);
		expect(discuss).toHaveTextContent("2 replies, 57 views");
		expect(
			screen.getByRole("heading", { name: "Recent forum posts" }),
		).toBeInTheDocument();
		expect(screen.getByText("octocat")).toBeInTheDocument();
		expect(
			screen.getByText("Version 1.2.3 of beskid.http was published."),
		).toBeInTheDocument();
		expect(screen.getByText("Open the thread")).toHaveAttribute(
			"href",
			"https://community.beskid-lang.org/topic/12/beskid-http",
		);

		// Facts
		expect(screen.getAllByText(/downloads/).length).toBeGreaterThan(0);
		expect(screen.getByText("Published by octocat")).toBeInTheDocument();
		expect(screen.getByText("7 dependents")).toBeInTheDocument();
		expect(screen.getByText("Source repository")).toBeInTheDocument();
		expect(screen.getByText("Project website")).toBeInTheDocument();

		// README (rendered Markdown) + dependencies
		expect(screen.getByText("README")).toBeInTheDocument();
		expect(
			screen.getAllByRole("heading", { level: 1, name: "beskid.http" }),
		).toHaveLength(2);
		expect(screen.getByText("A client.")).toBeInTheDocument();
		expect(screen.getByText("Dependencies")).toBeInTheDocument();
		expect(screen.getByText("beskid.core")).toBeInTheDocument();

		// Versions
		expect(screen.getByText("Versions")).toBeInTheDocument();
		expect(screen.getByText("1.2.3")).toBeInTheDocument();
		expect(screen.getByText("Download")).toBeInTheDocument();
	});

	it("does not render a community reviews section", () => {
		render(<PackageDetail details={details} />);
		expect(screen.queryByText("Community reviews")).not.toBeInTheDocument();
		expect(screen.queryByText("Post review")).not.toBeInTheDocument();
	});

	it("shows no discussion link when the registry has not opened a NodeBB thread", () => {
		render(
			<PackageDetail
				details={{ ...details, package: { ...details.package, community: null } }}
			/>,
		);
		expect(screen.queryByText(/Discuss/)).not.toBeInTheDocument();
	});
});
