# Design: aligned platform image preparation

Each required Node image has a single source of dependency truth: the
workspace lockfile selected by that image. Before a `--frozen-lockfile` install
the Docker build MUST have all manifests and local `file:` package sources that
the selected lockfile resolves. Context choice is an implementation detail;
root contexts and named BuildKit contexts are both valid if they yield the same
declared workspace graph.

The policy deliberately does not replace frozen installs with mutable installs.
Lock drift is a repository defect and must fail locally and in CI.
