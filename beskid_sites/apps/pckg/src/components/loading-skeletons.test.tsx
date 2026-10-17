import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	DocsPackageSkeleton,
	DocumentBodySkeleton,
	MyPackagesSkeleton,
	PackageDetailSkeleton,
	PackageFilesSkeleton,
	PublisherProfileSkeleton,
	ReleaseCenterSkeleton,
} from "./loading-skeletons";

describe("loading skeletons", () => {
	afterEach(cleanup);

	it.each([
		["Loading package", <PackageDetailSkeleton key="detail" />],
		["Loading package documentation", <DocsPackageSkeleton key="docs" />],
		["Loading package files", <PackageFilesSkeleton key="files" />],
		["Loading publisher profile", <PublisherProfileSkeleton key="publisher" />],
		["Loading your packages", <MyPackagesSkeleton key="mine" />],
		["Loading release center", <ReleaseCenterSkeleton key="release" />],
		["Loading guide", <DocumentBodySkeleton key="guide" label="Loading guide" />],
	])("announces %s as a busy status region", (label, node) => {
		render(node);
		const region = screen.getByRole("status", { name: label });
		expect(region.getAttribute("aria-busy")).toBe("true");
		expect(region.querySelector('[data-slot="skeleton"]')).not.toBeNull();
	});
});
