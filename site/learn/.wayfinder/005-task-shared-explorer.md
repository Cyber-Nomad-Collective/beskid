# wayfinder:task

## Question

Extract a reusable file explorer component into `@beskid_web_common/packages/beskid-ui-react` that can be shared across learn, website, pckg, platform-spec, and tracker.

Requirements:
1. The explorer should show a tree of files/directories with expand/collapse
2. It should support file selection callbacks and active file highlighting
3. It should match the Beskid design system tokens (not hardcoded colors)
4. It should be a pure presentational component (no filesystem access — receives a tree data structure as props)
5. For the learn site specifically, it should display the lesson's source files as a virtual tree (the actual files are sourced from curriculum or code strings, not disk)
6. Export from the existing `@beskid/ui-react` package alongside existing components like `BeskidHub`

Blocks on: 003-research-design-tokens (needs token alignment)
