<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Console controls Specification

## Purpose

In-terminal layout widgets—panel, stacks, progress bar, and live tick rendering.

## Requirements

### Requirement: Character-cell layout only: Decision [D-CORE-TERM-0040]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Coordinates | Rows/columns in character cells |
> | Graphics | Pixel graphics are out of scope |

**Stable ID:** `BSP-REQ-0F7AF00B1724`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/adr/0040-character-cell-layout/content.md`  
**Source SHA-256:** `ce75da42b60e456ffba566c421f7cbab8a3fc0b9156ff054a9abe6f5868d54dd`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: LiveTick caller-owned redraw loop: Decision [D-CORE-TERM-0041]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Tick | `LiveTick` drives periodic redraw |
> | Loop | Callers compose fibers/channels around tick |

**Stable ID:** `BSP-REQ-66E19059EE84`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/adr/0041-livetick-caller-owned-loop/content.md`  
**Source SHA-256:** `43d5938c431c12e0a54c2c8d928389ba352f7c1d6fbca622566902ebd37cd78c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Console controls

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/content.md`  
**SHA-256:** `a8e223b48cc217cd95bd82acb6b90c7f6cf3a7dcff3fcf679693938200eba1bf`

<details>
<summary>Migrated source text</summary>

``````markdown
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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0040` … `D-CORE-TERM-0041`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Character-cell layout only

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/adr/0040-character-cell-layout/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/adr/0040-character-cell-layout/content.md`  
**SHA-256:** `ce75da42b60e456ffba566c421f7cbab8a3fc0b9156ff054a9abe6f5868d54dd`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Terminal UI in corelib targets TTY character grids.

## Decision

| Rule | Detail |
| --- | --- |
| Coordinates | Rows/columns in character cells |
| Graphics | Pixel graphics are out of scope |

## Consequences

Layout helpers align with `Console.ConsoleSize` and resize events.

## Verification anchors

Console control tests under `packages/console`.
``````

</details>

### Source Record: LiveTick caller-owned redraw loop

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/adr/0041-livetick-caller-owned-loop/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/adr/0041-livetick-caller-owned-loop/content.md`  
**SHA-256:** `43d5938c431c12e0a54c2c8d928389ba352f7c1d6fbca622566902ebd37cd78c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Corelib should not embed a full UI framework inside controls.

## Decision

| Rule | Detail |
| --- | --- |
| Tick | `LiveTick` drives periodic redraw |
| Loop | Callers compose fibers/channels around tick |

## Consequences

Interactive samples pair LiveTick with concurrency package channels.

## Verification anchors

Console controls examples and tests.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `3f246910d16467f645e504ebda875fae0d78ad5baafeba0520e639abd4556a18`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **contracts and edge cases** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Normative requirements

| ID | Requirement |
| --- | --- |
| **CTL-001** | `Frame.Render` **must** clamp child layout to `columns` × `rows` from `ConsoleSize`. |
| **CTL-002** | Progress ratio **must** be in `0..=1`; out-of-range **should** clamp. |
| **CTL-003** | Full-screen controls **should** emit `Erase.DisplayAll` before draw when ANSI enabled. |
| **CTL-004** | `LiveTick` **must not** block the scheduler indefinitely; one tick == one render pass. |

### Edge cases

- Terminal shrink: controls **should** truncate lines rather than panic.
- Zero-size terminal: render **may** produce empty buffer.
- Resize mid-frame: next tick or `ConsoleMessage::Resize` **should** trigger relayout ([Console terminal events](/platform-spec/core-library/terminal-and-console/console-terminal-events/)).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/articles/design-model/content.md`  
**SHA-256:** `8a83aa81359667f10582a61e3e395a39ae3799eede550fdf6b888e564d2f7eae`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **design model** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Control graph

| Type | Role |
| --- | --- |
| `Panel` | Bordered region with title |
| `VerticalStack` / `HorizontalStack` | 1D child arrangement |
| `ProgressBar` | Ratio fill inside width budget |
| `Frame` | Root container tying size + children |
| `LiveTick` | Schedules periodic `Render` invocations |

`RenderContext` carries current column/row cursor, available `ConsoleSize`, and whether ANSI motion is allowed.

### Rendering model

Layout is **greedy character grid**: children receive max width/height from parent minus borders/padding. Output is a single string buffer flushed with cursor save/restore per frame (see [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/design-model/) DEC sequences).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/articles/examples/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/articles/examples/content.md`  
**SHA-256:** `a95362225dc7526239ca26e1bfa13da88933d0728336423bfc8013164f559b0a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **examples** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

```beskid
ConsoleSize size = Console.QuerySize();
// build Frame + Panel + ProgressBar per Controls API
// frame.Render() → string written with Core.Output.Write
```

Pair with `Console.RunTick` and a `Channel<ConsoleMessage>` for resize-aware dashboards—see [Console terminal events / examples](/platform-spec/core-library/terminal-and-console/console-terminal-events/examples/).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/articles/flow-and-algorithm/content.md`  
**SHA-256:** `735faa74f237ecb28081f8549857669482c4edb2c7280cc657c22d3df5707537`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **flow and algorithm** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Single frame

1. `save ← EmitDec("7")`
2. Optional `Erase.DisplayAll` when clearing screen
3. Walk control tree → append styled/plain segments to buffer
4. `restore ← EmitDec("8")`
5. `Core.Output.Write(buffer)`

### Live tick loop (sketch)

1. Create `Channel<ConsoleMessage>` via `Console.MessagesChannel()`
2. Fiber loop: `Console.RunTick(channel, lastSize)` → may enqueue `Resize`
3. On message: if `Resize`, invalidate layout; call `Frame.Render`
4. Yield or sleep between ticks (host policy)

Cursor/erase sequences: [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/flow-and-algorithm/).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-controls/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-controls/articles/verification-and-traceability/content.md`  
**SHA-256:** `72f5912ab29c7bc9ee1aea5fbf900f7d39c8d6fbe791a2c4dcf5863204401a63`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **verification and traceability** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

| Test | Coverage |
| --- | --- |
| `ControlsFrameTests.bd` | Frame save/restore wrapping |
| `ControlsPanelTests.bd` | Panel borders |
| `ControlsProgressBarTests.bd` | Ratio rendering |
| `ControlsLayoutTests.bd` | Stack measurement |

Sources under `compiler/corelib/packages/console/src/Console/Controls/`.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>
