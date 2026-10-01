// Reviewed 0.5.1 CLI command inventory. Keep this independent of the gate's
// reported rows so an incomplete report cannot qualify by changing counts.
export const BRANCHES = [
  "dev", "dev syntax", "dev project", "dev build", "dev package", "dev package registry",
  "import", "mod", "runtime-kit", "new", "pckg", "up", "lsp",
];

export const SMOKE_LEAVES = [
  "analyze", "build", "clif", "corelib", "dev build compile", "dev build corelib",
  "dev build test", "dev package registry details", "dev package registry download",
  "dev package registry list", "dev package registry pack", "dev package registry search",
  "dev package registry versions", "dev package registry whoami", "dev project fetch",
  "dev project graph", "dev project lock", "dev project update", "dev syntax analyze",
  "dev syntax clif", "dev syntax doc", "dev syntax format", "dev syntax parse",
  "dev syntax tree", "doc", "fetch", "format", "graph", "import lib", "lock",
  "migrate-bsol", "new list", "parse", "pckg details", "pckg download", "pckg list",
  "pckg pack", "pckg search", "pckg versions", "pckg whoami", "repl", "run", "test",
  "tree", "up check", "up host-target", "up list", "update", "validate-bsol",
];

export const SETUP_SKIPS = [
  "lsp install", "mod clean", "mod rebuild", "new install", "new uninstall",
  "pckg configure", "pckg unyank", "pckg upload", "pckg yank", "runtime-kit build",
  "runtime-kit build-matrix", "runtime-kit build-native-host", "up remove", "up use",
  "dev package registry configure", "dev package registry unyank",
  "dev package registry upload", "dev package registry yank",
];

export const SCENARIOS = [
  "new <local-template>", "graph --out", "graph --tui", "analyze --plain PTY", "--version",
];

export const EXPECTED_ROWS = new Map([
  ...BRANCHES.map(path => [path, ["branch", "inventory_only"]]),
  ...SMOKE_LEAVES.map(path => [path, ["leaf", "pass"]]),
  ...SETUP_SKIPS.map(path => [path, ["leaf", "setup_skip"]]),
  ...SCENARIOS.map(path => [path, ["scenario", "pass"]]),
]);
