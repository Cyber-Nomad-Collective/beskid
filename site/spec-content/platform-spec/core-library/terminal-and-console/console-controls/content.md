---
title: Console controls
description: In-terminal layout widgets—panel, stacks, progress bar, and live
  tick rendering.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Console.Controls` provides character-cell layout primitives: **Panel**, **VerticalStack** / **HorizontalStack**, **ProgressBar**, **Frame**, and **LiveTick** integration. Rendering produces escape sequences for cursor save/restore, erase, and bounded redraw regions.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
- Controls **must** query `Console.QuerySize()` (or injected size) before layout.
- Full-frame redraw **should** use DEC save/restore (`ESC 7` / `ESC 8`) around the composed buffer.
- Render output **must** respect `ShouldEmitAnsi()`; plain mode emits text layout without motion sequences.
- Controls **must not** introduce new syscalls; writes go through [Console I/O streams](/platform-spec/core-library/terminal-and-console/console-io-streams/).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/console/src/Console/Controls/`
- Tests: `ControlsFrameTests.bd`, `ControlsPanelTests.bd`, `ControlsProgressBarTests.bd`, `ControlsLayoutTests.bd`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0040`, `D-CORE-TERM-0041`); use the reader **ADRs** tab for expandable detail.
