# wayfinder:prototype

## Question

What should the tiled lesson workspace layout look like? Build a throwaway prototype of the horizontal resizable tile grid so we can react to concrete UX before committing.

The prototype should explore:
1. A horizontal split with resizable panes (editor, terminal, file explorer, lesson content)
2. Tabbed interface within each pane (e.g., terminal could have "Output" + "Compiler Logs" tabs; editor could have multiple source files as tabs)
3. Per-lesson tile configuration defaults (which tiles, their order, default sizes)
4. Collapse/expand behavior per tile
5. Compact mode behavior (mobile/small screens)

The prototype should:
- Be a single-file React component or HTML file, not integrated into the real app
- Use the existing Beskid design tokens (dark theme)
- Be throwaway — purpose is to generate reaction, not production code
- Output as `site/learn/.wayfinder/prototype-workspace/index.html` or similar

Blocks on: none (can start immediately)
