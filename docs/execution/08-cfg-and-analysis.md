---
description: CFG and analysis helpers
---

# CFG and analysis helpers

## Purpose
Control-flow graphs are useful for optimization, validation, and diagnostics.

## Options
### 1) Cranelift CFG
Use `cranelift_codegen::flowgraph::ControlFlowGraph` on CLIF functions.
- `ControlFlowGraph::with_function(func)`
- `pred_iter` / `succ_iter`

Reference: https://docs.rs/cranelift-codegen/latest/cranelift_codegen/flowgraph/struct.ControlFlowGraph.html

### 2) Petgraph for HIR-level CFG
Use `petgraph` if you need graph algorithms at the HIR stage.
- https://docs.rs/petgraph/latest/petgraph/

## Notes
- Prefer CLIF CFG for backend validation.
- Prefer HIR CFG if you need source-level diagnostics.
- Add CFG-based checks for missing write-barrier calls on heap pointer stores.
