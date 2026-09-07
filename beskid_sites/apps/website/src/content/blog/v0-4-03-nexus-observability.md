---
title: "Nexus, Grafana, and the Observability You Don't Think About Until Production Is Down"
description: "v0.4 shipped the graph explorer for compiler architecture and execution flows, plus Grafana/Memgraph monitoring. The kind of thing that takes weeks and looks like it took hours."
date: 2026-06-05
blogStatus: released
release: v0.4
---

Observability work is invisible until you need it. Then it is the only thing that matters.

v0.4 shipped two pieces of the observability story: Nexus, the shared graph explorer for navigating compiler internals, and the Grafana/Memgraph monitoring stack at monitor.beskid-lang.org. Neither is glamorous. Both are the kind of infrastructure you do not think about until production is down and you have no idea why. And both were built in `beskid_web_common` — because if you build an observability primitive once, correctly, every surface benefits.

## Nexus: one explorer, everywhere

The Beskid compiler is a graph. The package dependency tree is a graph. The execution flow from source to CLIF is a graph. The platform spec is a graph of contracts, implementations, and verification results.

If you build a graph explorer for the compiler, you will eventually want one for the spec site. If you build one for the spec site, you will want one for the package registry. If you build three separate explorers, you will spend half your maintenance budget keeping them from drifting — the ReactFlow version mismatch, the d3 layout algorithm that was improved in one but not the others, the zoom behavior that feels slightly different on each surface.

v0.4 said no. The Nexus explorer — shared ReactFlow and d3 components built in `beskid_web_common` — is one widget used across the website, the package registry, the platform spec, and the tracker. Each surface feeds it different data through a shared adapter interface. Each surface gets the same interaction model: zoom with scroll, pan with drag, click nodes for detail panels, follow edges to dependencies, search to highlight. The explorer is not a product. It is a primitive — like a button or a form field, but for graphs.

## The shared adapter interface

Nexus doesn't know about compilers, packages, specs, or trackers. It knows about nodes and edges. Each surface implements a data adapter:

```rust
trait NexusAdapter {
    fn nodes(&self) -> Vec<NexusNode>;
    fn edges(&self) -> Vec<NexusEdge>;
    fn node_detail(&self, id: &str) -> NexusDetail;
}
```

The compiler surface implements it by walking the crate graph and the HIR-to-MIR lowering stages. The spec site implements it by walking the contract-implementation-verification graph. The package registry implements it by walking the dependency tree. The tracker doesn't need to know any of this — it just calls `nexus.render(adapter)` and gets an interactive graph.

## The surfaces Nexus powers

**Compiler architecture.** The crate dependency graph rendered as an interactive explorer. Which crate calls which, which module defines what, how a token flows from lexer to parser to HIR to MIR to codegen. The kind of diagram you draw on a whiteboard once during onboarding and never update. Nexus keeps it live — if a crate dependency changes, the graph changes. No manual redrawing.

**Execution flows.** The path from Beskid source through the compiler pipeline to Cranelift CLIF. The lowering stages rendered as nodes. The ISLE rule applications rendered as edges. The verification gates rendered as checkpoints. A graph that answers "what happens to this expression?" without grep, without reading lowering passes, without asking the person who wrote the compiler.

**Platform spec contracts.** Implementations linked to their contracts. Tests linked to their implementations. Verification results linked to their test runs. A graph that answers "is this contract satisfied?" without reading YAML. Click a contract, see every implementation. Click an implementation, see every test. Click a test, see the last verification result — pass, fail, or not yet run.

## Grafana and Memgraph

At monitor.beskid-lang.org, Grafana dashboards track the signals that matter when something breaks:

- **CI pipeline health.** Per-crate pass/fail rates, failure trends over time, flaky test detection. A red dashboard tile doesn't tell you what broke, but it tells you something broke — and it tells you before a contributor opens an issue.

- **Compiler benchmark trends.** Compilation time per benchmark, memory usage per phase, codegen output size. A regression that takes three weeks to notice is three weeks of commits to bisect. A regression that shows up on the dashboard the next morning is one commit to revert.

- **Service uptime.** The spec site, the package registry, the tracker, the monitor dashboard itself. If the monitor goes down, someone gets paged. If the monitor can't monitor itself, you have no way to know anything is wrong.

Memgraph — a graph database optimized for real-time graph queries — backs the metrics that need more than a time-series database. Dependency graphs that change with each compiler bump. Call graphs that shift as lowering passes are rewritten. The relationships that matter when debugging a performance regression: "which crate's compile time spiked?" is a Prometheus query; "which crate does that crate depend on?" is a Memgraph query.

The Grafana setup is not exotic. It is Prometheus metrics exported from each service, Grafana dashboards defined as code, and alerting rules that fire when the CI failure rate crosses a threshold or compiler latency spikes beyond two standard deviations. The kind of thing every production service needs and most hobby projects skip — because "production" feels far away until it isn't.

## Why this work is invisible

No one celebrates a dashboard. No one tweets about a graph explorer widget. The work that went into Nexus — the ReactFlow integration, the d3 force-directed layout, the shared component API, the data adapter trait, the per-surface adapter implementations — is the kind of work that takes weeks and looks like it took hours. The Grafana setup is the kind of thing you configure once, forget about, and only remember exists when it pages you at 2 AM.

But when it pages you at 2 AM, you are glad it exists. When you can trace a compiler regression to a specific ISLE rule because Nexus showed you the lowering path, you are glad someone built the explorer before you needed it. When a CI flake turns into a pattern on the dashboard before it turns into a bug report, you are glad someone wired up the metrics.

Observability is not a feature. It is insurance. You pay the premium in advance — weeks of unglamorous work — and you collect when production goes down. Every project that skips the premium pays it later, with interest, at 2 AM, with no dashboards.

Next: [A Language Is Not Just a Compiler](/blog/v0-4-04-platform-not-compiler/)
