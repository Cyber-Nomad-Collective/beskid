Mirrors of the Beskid Starlight **platform-spec** stylesheet split (same semantics as `site/website/src/styles/platform-spec-*.css`).

- `platform-spec-core.css` — top bar, hero, tiles, typography, Starlight duplicate title suppression.
- `platform-spec-graph-and-reader.css` — declaration graph layout, reader shell, Starlight tabs, hub chrome.
- `platform-spec-map-and-shell.css` — full-bleed map, detail panel, intro.js tour, architecture graph shell.
- `platform-spec.css` — barrel `@import` (order matters).

Third-party projects can copy these files or depend on a published `trudoc` version once the mirror is wired to npm releases.
