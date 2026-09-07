import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { blogPosts } from "#/lib/content-manifest";
import { Route } from "#/routes/blog";

const BlogIndexPage = (Route as unknown as { component: React.FC }).component;

describe("BlogIndexPage", () => {
	it("renders the blog index heading and lead", () => {
		render(<BlogIndexPage />);
		expect(screen.getByText("The work behind Beskid")).toBeInTheDocument();
		expect(
			screen.getByText(/Release notes, engineering essays, and design records/i),
		).toBeInTheDocument();
	});

	it("lists all blog posts from the content manifest", () => {
		render(<BlogIndexPage />);
		// Every post title should appear (featured + archive).
		for (const post of blogPosts) {
			expect(screen.getByText(post.title)).toBeInTheDocument();
		}
	});

	it("renders the featured post and an archive count", () => {
		render(<BlogIndexPage />);
		expect(screen.getByText("All posts")).toBeInTheDocument();
		const [featured, ...archive] = blogPosts;
		expect(
			screen.getByText(`${archive.length} posts, newest first.`),
		).toBeInTheDocument();
		// Featured title appears in the featured card.
		expect(screen.getByText(featured.title)).toBeInTheDocument();
	});
});

describe("blogPosts manifest", () => {
	it("is sorted newest-first by date", () => {
		const dates = blogPosts
			.map((p) => (p.date ? Date.parse(p.date) : 0))
			.filter((n) => !Number.isNaN(n));
		const sorted = [...dates].sort((a, b) => b - a);
		expect(dates).toEqual(sorted);
	});

	it("includes at least one released post", () => {
		expect(blogPosts.some((p) => p.blogStatus === "released")).toBe(true);
	});
});
