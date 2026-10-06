// Reviewed 0.6 canonical CLI inventory, independent of reported rows.
export const BRANCHES = [
  "dev", "dev syntax", "dev project", "dev bsol", "dev mod", "dev runtime-kit",
  "package", "package template", "toolchain", "dev lsp",
];
export const SMOKE_LEAVES = [
  "new", "check", "build", "run", "test", "fmt", "doc", "dev build", "dev corelib",
  "dev import lib", "dev repl", "dev capabilities", "dev syntax parse", "dev syntax tree",
  "dev syntax clif", "dev project fetch", "dev project lock", "dev project graph",
  "dev bsol validate", "dev bsol migrate", "package search", "package info", "package pack",
  "package template list", "toolchain status",
];
// dev import is a branch; lib is its leaf. dev lsp has optional nested install.
BRANCHES.push("dev import");
export const SETUP_SKIPS = [
  "add", "remove", "update", "doctor", "dev mod rebuild", "dev mod clean",
  "dev runtime-kit build", "dev runtime-kit build-native-host", "dev runtime-kit build-matrix",
  "dev lsp install", "package template install", "package template uninstall",
  "package publish", "package login", "package logout", "toolchain update",
];
export const SCENARIOS = [
  "new <local-template>", "dev project graph --out", "dev project graph --tui", "check --plain PTY", "--version",
];
export const EXPECTED_ROWS = new Map([
  ...BRANCHES.map(path => [path, ["branch", "inventory_only"]]),
  ...SMOKE_LEAVES.map(path => [path, ["leaf", "pass"]]),
  ...SETUP_SKIPS.map(path => [path, ["leaf", "setup_skip"]]),
  ...SCENARIOS.map(path => [path, ["scenario", "pass"]]),
]);
