/**
 * No-op hub entry.
 *
 * The old `@beskid/beskid-ui` package shipped a client entry that registered
 * Beskid hub web components. The canonical `@cyber-nomad-collective/beskid-ui-react`
 * lib ships `BeskidHub` as a React component instead, so there is nothing to
 * register at import time. This stub keeps the `#beskid-hub-entry` alias
 * resolvable until the import is removed from `main.tsx`.
 */
export {};
