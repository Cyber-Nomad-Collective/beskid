import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bookChapters } from "#/lib/content-manifest";
import { Route } from "#/routes/book";

// The book index route uses TanStack `<Link>` which is mocked in test-setup
// to render as a plain `<a>` — so the page renders without a router. The
// `createFileRoute` mock returns its options, so `Route.component` is the
// page component.
const BookIndexPage = (Route as unknown as { component: React.FC }).component;

describe("BookIndexPage", () => {
	it("renders the book index heading and lead", () => {
		render(<BookIndexPage />);
		expect(
			screen.getByText("A practical language tutorial for Beskid"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/From first install to contributing across the platform/i),
		).toBeInTheDocument();
	});

	it("lists the tutorial chapters from the content manifest", () => {
		render(<BookIndexPage />);
		// Every chapter title from the manifest should appear in the list.
		for (const chapter of bookChapters) {
			expect(screen.getByText(chapter.title)).toBeInTheDocument();
		}
	});

	it("renders a link per chapter", () => {
		render(<BookIndexPage />);
		const links = screen.getAllByRole("link");
		// At least one link per chapter.
		expect(links.length).toBeGreaterThanOrEqual(bookChapters.length);
	});
});

describe("bookChapters manifest", () => {
	it("includes the first tutorial chapter", () => {
		expect(bookChapters.some((c) => c.slug === "book/00-why-beskid-exists")).toBe(
			true,
		);
	});

	it("includes the last tutorial chapter", () => {
		expect(
			bookChapters.some((c) => c.slug === "book/22-so-you-want-to-contribute"),
		).toBe(true);
	});

	it("does not include sub-pages", () => {
		expect(
			bookChapters.some(
				(c) => c.slug === "book/00-why-beskid-exists/whats-in-the-name",
			),
		).toBe(false);
	});
});
