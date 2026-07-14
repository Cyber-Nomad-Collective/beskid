<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Console capabilities Specification

## Purpose

TTY detection, NO_COLOR and FORCE_COLOR policy, and color-model downgrade for styled output.

## Requirements

### Requirement: NO_COLOR disables color: Decision [D-CORE-TERM-0020]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | `NO_COLOR` | Non-empty value **must** force `ShouldEmitAnsi()` false |
> | Reference | [no-color.org](https://no-color.org/) |

**Stable ID:** `BSP-REQ-87156FC737F8`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0020-no-color-semantics/content.md`  
**Source SHA-256:** `a055b039f502c167afaf01b9f961277dad07c1db6489dc6c97bc9dfdc746b70e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: COLORTERM upgrades to TrueColor: Decision [D-CORE-TERM-0021]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Probe | `COLORTERM` set → `TrueColor` when color not stripped |
> | `FORCE_COLOR` | May enable emission on non-TTY stdout |

**Stable ID:** `BSP-REQ-9C0680FF8CE1`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0021-colorterm-truecolor-upgrade/content.md`  
**Source SHA-256:** `01c02c456e09b33f12e53484d36e01522bd61ed022a2fe3127a7d0a5a51377d9`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Lossy color downgrade: Decision [D-CORE-TERM-0022]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Downgrade | RGB → indexed → basic is **lossy** |
> | API | No per-sequence model selector on public helpers |

**Stable ID:** `BSP-REQ-5573952BEEA6`  
**Legacy source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0022-lossy-color-downgrade/content.md`  
**Source SHA-256:** `c0fbb04b00a5d7e4d51935cce07d52a99d8e9fdd18eebdfec7cabb9185d9633b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Console capabilities

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/content.md`  
**SHA-256:** `71f46de340e6ba44a77ab84d6d2be0ddcb5a649a65a91f8f4887f4e35a75333d`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Console.Capabilities` and `Platform.Terminal` probe whether styled output is appropriate: TTY detection on fd **1**, environment flags (`NO_COLOR`, `FORCE_COLOR`, `COLORTERM`, `TERM`), and the **effective color model** used by `Ansi.Sgr` downgrade logic.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
- `ShouldEmitAnsi()` **must** return **false** when `NO_COLOR` is set (non-empty value per `EnvFlagSet`).
- When not forced, non-TTY stdout **must** suppress ANSI emission.
- `FORCE_COLOR` **must** enable emission even when stdout is not a TTY.
- `EffectiveColorModel` **must** return `Basic16` when color is stripped, otherwise the probed model (`Basic8`, `Basic16`, `Indexed256`, `TrueColor`).
- `Platform.Terminal.ForcePlainText()` **should** align with dumb terminals (`TERM=dumb`) and piped stdout unless `FORCE_COLOR` is set.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/console/src/Console/Capabilities.bd`
- `compiler/corelib/packages/console/src/Platform/Terminal.bd`
- Tests: `CapabilitiesTests.bd`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0020` … `D-CORE-TERM-0022`); use the reader **ADRs** tab for expandable detail.
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

### Source Record: NO_COLOR disables color

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0020-no-color-semantics/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0020-no-color-semantics/content.md`  
**SHA-256:** `a055b039f502c167afaf01b9f961277dad07c1db6489dc6c97bc9dfdc746b70e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Users and CI expect no-color.org semantics for accessibility and logs.

## Decision

| Rule | Detail |
| --- | --- |
| `NO_COLOR` | Non-empty value **must** force `ShouldEmitAnsi()` false |
| Reference | [no-color.org](https://no-color.org/) |

## Consequences

Capability probes and markup render paths consult the same gate.

## Verification anchors

`CapabilitiesTests.bd`; `Console/Capabilities.bd`.
``````

</details>

### Source Record: COLORTERM upgrades to TrueColor

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0021-colorterm-truecolor-upgrade/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0021-colorterm-truecolor-upgrade/content.md`  
**SHA-256:** `01c02c456e09b33f12e53484d36e01522bd61ed022a2fe3127a7d0a5a51377d9`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Modern terminals advertise truecolor via COLORTERM without breaking NO_COLOR.

## Decision

| Rule | Detail |
| --- | --- |
| Probe | `COLORTERM` set → `TrueColor` when color not stripped |
| `FORCE_COLOR` | May enable emission on non-TTY stdout |

## Consequences

EffectiveColorModel reflects env probes before SGR downgrade (see D-CORE-TERM-0003).

## Verification anchors

`CapabilitiesTests.bd`.
``````

</details>

### Source Record: Lossy color downgrade

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0022-lossy-color-downgrade/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/adr/0022-lossy-color-downgrade/content.md`  
**SHA-256:** `c0fbb04b00a5d7e4d51935cce07d52a99d8e9fdd18eebdfec7cabb9185d9633b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Callers should not manually pick CSI color modes per terminal.

## Decision

| Rule | Detail |
| --- | --- |
| Downgrade | RGB → indexed → basic is **lossy** |
| API | No per-sequence model selector on public helpers |

## Consequences

Styled output remains readable on Basic16 hosts without author branches.

## Verification anchors

`AnsiSgrGoldenTests.bd`; capability + SGR integration.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `602d1db5379a732f1daf780f5486a4fd33d7e08ce2f15f92549116c6d0494b2a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **contracts and edge cases** for the **Console Capabilities** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Normative requirements

| ID | Requirement |
| --- | --- |
| **CAP-001** | `ShouldStripColor` **must** return true when `colorDisabled` is true. |
| **CAP-002** | When `colorForced` is true, `ShouldStripColor` **must** return false regardless of TTY. |
| **CAP-003** | When neither forced nor disabled, non-TTY **must** strip color. |
| **CAP-004** | `ShouldEmitAnsi()` **must** be consistent with `ShouldStripColor(ProbeStdout())`. |
| **CAP-005** | `EffectiveColorModel` **must** return `Basic16` whenever `ShouldStripColor` is true. |

### Environment table

| Variable | Effect |
| --- | --- |
| `NO_COLOR` | Disables color (CAP-001) |
| `FORCE_COLOR` | Enables color even if not TTY |
| `COLORTERM` | Upgrades model toward truecolor when color allowed |
| `TERM=dumb` | `ForcePlainText` true |
| `TERM=xterm-256color` | Indexed256 probe |

### Edge cases

- **Empty vs unset env**: `EnvFlagSet` treats any non-empty value as set; `NO_COLOR=` may still disable per CAP-001.
- **stderr styling**: v1 probes **stdout only** for `ShouldEmitAnsi`; stderr diagnostics use the same predicate today.
- **CI logs**: Piped stdout suppresses escapes unless `FORCE_COLOR=1` in job env.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-capabilities/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/articles/design-model/content.md`  
**SHA-256:** `a0d25c605fafeb222593d53276ce9004e79e7f2a34ebaa36c789a79166df914c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **design model** for the **Console Capabilities** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### `Capabilities` record

| Field | Meaning |
| --- | --- |
| `isTty` | stdout (fd 1) is a terminal |
| `colorDisabled` | `NO_COLOR` set |
| `colorForced` | `FORCE_COLOR` set |
| `model` | Probed `ColorModel` before strip |

`ProbeStdout()` composes the record from `Platform.Terminal.IsAtty(1)` and environment helpers.

### `ColorModel` ladder

| Variant | Typical trigger |
| --- | --- |
| `Basic8` | Reserved for minimal terminals |
| `Basic16` | Default when stripped or `TERM=xterm-color` |
| `Indexed256` | `TERM=xterm-256color` or generic `TERM` set |
| `TrueColor` | `COLORTERM` set (e.g. `truecolor`) |

`Ansi.Sgr` maps requested RGB to the **effective** model after `ShouldStripColor`.

### Interaction with ANSI emission

`ShouldEmitAnsi()` is equivalent to `!ShouldStripColor(ProbeStdout())`. All gated escape helpers consult this predicate; see [ANSI escape model / flow and algorithm](/platform-spec/core-library/terminal-and-console/ansi-escape-model/flow-and-algorithm/).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-capabilities/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/articles/examples/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/articles/examples/content.md`  
**SHA-256:** `ee24e8b90fa9dcde838100ff393ed033146f9d1ac1c249dd5e81f034d8961a4d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **examples** for the **Console Capabilities** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

```beskid
if Console.Capabilities.ShouldEmitAnsi() {
    Console.FormatLine("[bold]interactive[/]");
} else {
    Core.Output.WriteLine("interactive");
}
```

```beskid
Console.Capabilities.Capabilities caps = Console.Capabilities.ProbeStdout();
Console.Capabilities.ColorModel model =
    Console.Capabilities.EffectiveColorModel(caps);
// use model for custom RGB downgrade outside SgrBuilder
```

For escape tables and SGR parameters, see [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-capabilities/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/articles/flow-and-algorithm/content.md`  
**SHA-256:** `2354d62da7b06ff3b03862a975a09412c33cc376d79809e5a80de109d05dbe17`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **flow and algorithm** for the **Console Capabilities** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### `ProbeStdout` algorithm

1. `isTty ← Terminal.IsAtty(1) != 0`
2. `colorDisabled ← EnvFlagSet("NO_COLOR")`
3. `colorForced ← EnvFlagSet("FORCE_COLOR")`
4. `model ← Terminal.ProbeColorModel()` (honors `ForcePlainText` internally)
5. Return `Capabilities { ... }`

### `ShouldStripColor` decision tree

1. If `colorDisabled` → **strip**
2. Else if `colorForced` → **do not strip**
3. Else if `!isTty` → **strip**
4. Else → **do not strip**

### `ProbeColorModel` (platform)

1. If `ForcePlainText()` → `Basic16`
2. Else if `COLORTERM` set → `TrueColor`
3. Else match `TERM` (`xterm-256color`, `xterm-color`, …)
4. Default → `Indexed256`

Downstream `Ansi.Sgr` reads the model once per `IntoPrefix` / RGB call path.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-capabilities/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/terminal-and-console/console-capabilities/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/core-library/terminal-and-console/console-capabilities/articles/verification-and-traceability/content.md`  
**SHA-256:** `f00381b254970e780d353da7b71a8d7dc344c4ec1fb4559aac6cf8bdf103f33b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Document **verification and traceability** for the **Console Capabilities** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

| Artifact | Role |
| --- | --- |
| `Console/Capabilities.bd` | `ProbeStdout`, `ShouldEmitAnsi`, strip logic |
| `Platform/Terminal.bd` | `ProbeColorModel`, `ForcePlainText`, `IsAtty` |
| `CapabilitiesTests.bd` | Strip vs emit behavior |
| `AnsiEscapeTests.bd` | Conditional empty sequences when ANSI disabled |

Changes to **CAP-001**–**CAP-005** **must** extend `CapabilitiesTests.bd` or ANSI golden tests that assert gating.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-capabilities/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
``````

</details>
