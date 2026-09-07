import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "../index";

describe("ThemeProvider", () => {
	it("mounts and renders children", () => {
		const { container } = render(
			<ThemeProvider>
				<div data-testid="child">hello</div>
			</ThemeProvider>,
		);
		expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
	});
});
