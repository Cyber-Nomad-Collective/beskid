/**
 * Renders a compiled MDX component inside an `<MDXProvider>` that supplies
 * the React replacements for the Astro-specific components used in the
 * migrated corpus (`Aside`, `YouTube`).
 */

import { MDXProvider } from "@mdx-js/react";
import type { ComponentType } from "react";
import { mdxComponents } from "#/components/mdx-components";

interface MdxRendererProps {
	Component: ComponentType<Record<string, never>>;
}

export function MdxRenderer({ Component }: MdxRendererProps) {
	return (
		<MDXProvider components={mdxComponents}>
			<Component />
		</MDXProvider>
	);
}
