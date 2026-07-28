import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonContent } from "./LessonContent";

describe("LessonContent", () => {
	it("renders Markdown headings and code blocks as separate semantic elements", () => {
		render(<LessonContent markdown={"## Hello\n\nText\n\n```beskid\ni32 Main() {}\n```"} />);

		expect(screen.getByRole("heading", { name: "Hello", level: 2 })).toBeTruthy();
		expect(screen.getByText("i32 Main() {}", { exact: false })).toBeTruthy();
	});
});
