import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CommunityProfile, PackageSummary } from "#/lib/pckg-api";
import { PublisherProfile } from "./publisher-profile";

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

const profile: CommunityProfile = {
	subject: "github:42",
	display_name: "Octocat",
	bio: "Maintainer of Beskid packages.",
	social_links: ["https://github.com/octocat", "https://beskid-lang.org"],
};

const packages: PackageSummary[] = [
	{
		id: "1",
		name: "beskid.http",
		description: "HTTP client",
		category: "network",
		repositoryUrl: null,
		websiteUrl: null,
		tags: ["http"],
		totalDownloads: 100,
		updatedAtUtc: "2026-01-01T00:00:00Z",
		ownerDisplayName: "Octocat",
	},
];

describe("PublisherProfile", () => {
	it("renders the hero and published packages", () => {
		render(<PublisherProfile profile={profile} packages={packages} />);

		expect(
			screen.getByRole("heading", { name: "Octocat", level: 1 }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Maintainer of Beskid packages."),
		).toBeInTheDocument();
		expect(screen.getByText("beskid.http")).toBeInTheDocument();
	});

	it("does not render community follow or social links", () => {
		render(<PublisherProfile profile={profile} packages={[]} />);

		expect(screen.queryByText("Follow publisher")).not.toBeInTheDocument();
		expect(screen.queryByText("Following")).not.toBeInTheDocument();
		expect(
			screen.queryByText("https://github.com/octocat"),
		).not.toBeInTheDocument();
	});
});
