import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Landing } from "#/components/landing";

describe("Landing", () => {
	it("renders the hero title and tagline", () => {
		render(<Landing />);
		expect(
			screen.getByText(
				/A language and platform built for the code you ship every day/i,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/Readable semantics, compile-time power, and native output/i,
			),
		).toBeInTheDocument();
	});

	it("renders primary navigation actions", () => {
		render(<Landing />);
		expect(screen.getByText("Download")).toBeInTheDocument();
		expect(screen.getByText("Read the book")).toBeInTheDocument();
		expect(screen.getByText("Blog")).toBeInTheDocument();
	});

	it("renders the six Beskid principles", () => {
		render(<Landing />);
		expect(
			screen.getByText("Language features stay in the language"),
		).toBeInTheDocument();
		expect(screen.getByText("Compile-time over reflection")).toBeInTheDocument();
		expect(
			screen.getByText("Native direction, not a CIL detour"),
		).toBeInTheDocument();
		expect(screen.getByText("Built for daily driving")).toBeInTheDocument();
		expect(screen.getByText("One obvious way")).toBeInTheDocument();
		expect(screen.getByText("Honest by default")).toBeInTheDocument();
	});

	it("renders the start-here section with links to book chapters", () => {
		render(<Landing />);
		expect(screen.getByText("Start here")).toBeInTheDocument();
		expect(screen.getByText("Why Beskid exists →")).toBeInTheDocument();
		expect(screen.getByText("It works on my machine →")).toBeInTheDocument();
		expect(screen.getByText("Downloads →")).toBeInTheDocument();
	});
});
