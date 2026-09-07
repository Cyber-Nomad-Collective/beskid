import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnimatedMode } from "../client/transitions";
import {
	AnimatedModeSwitcher,
	PageTransition,
	usePageTransition,
} from "../client/transitions";

describe("PageTransition", () => {
	afterEach(() => cleanup());

	it("renders the wrapped children for the current route", () => {
		render(
			<PageTransition routeKey="/a">
				<div data-testid="page">A</div>
			</PageTransition>,
		);
		expect(screen.getByTestId("page").textContent).toBe("A");
	});

	it("renders without animation when disabled", () => {
		render(
			<PageTransition routeKey="/a" disabled>
				<div data-testid="page">A</div>
			</PageTransition>,
		);
		expect(screen.getByTestId("page").textContent).toBe("A");
	});
});

describe("AnimatedModeSwitcher", () => {
	afterEach(() => cleanup());

	const modes: AnimatedMode[] = [
		{ id: "docs", label: "Docs" },
		{ id: "pckg", label: "pckg" },
	];

	it("renders one tab per mode and marks the active one", () => {
		render(<AnimatedModeSwitcher mode="docs" modes={modes} />);
		const tabs = screen.getAllByRole("tab");
		expect(tabs).toHaveLength(2);
		expect(tabs[0].getAttribute("aria-selected")).toBe("true");
		expect(tabs[1].getAttribute("aria-selected")).toBe("false");
	});

	it("calls onChange with the picked mode id", () => {
		const onChange = vi.fn();
		render(
			<AnimatedModeSwitcher mode="docs" modes={modes} onChange={onChange} />,
		);
		fireEvent.click(screen.getByText("pckg"));
		expect(onChange).toHaveBeenCalledWith("pckg");
	});

	it("renders nothing when the mode list is empty", () => {
		const { container } = render(<AnimatedModeSwitcher mode="docs" modes={[]} />);
		expect(container.firstChild).toBeNull();
	});
});

describe("usePageTransition", () => {
	it("returns variants and transition matching the shell tokens", () => {
		function Consumer() {
			const { variants, transition } = usePageTransition();
			const duration = (transition as { duration?: number }).duration;
			return (
				<div
					data-testid="c"
					data-duration={String(duration)}
					data-variants={JSON.stringify(variants)}
				/>
			);
		}
		render(<Consumer />);
		const el = screen.getByTestId("c");
		// duration mirrors --beskid-transition-base (160ms → 0.16s).
		expect(el.dataset.duration).toBe("0.16");
		const variants = JSON.parse(el.dataset.variants ?? "{}");
		expect(variants.initial.opacity).toBe(0);
		expect(variants.animate.opacity).toBe(1);
	});
});
