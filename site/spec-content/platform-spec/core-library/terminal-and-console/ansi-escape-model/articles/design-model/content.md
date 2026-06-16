---
title: Design model
description: ESC/CSI/OSC taxonomy and normative control-character tables for
  terminal output.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Purpose

Normative **ESC / CSI / OSC** taxonomy and sequence tables used by `corelib_console` `Ansi.*` builders, aligned with repository **`ANSI.md`**.

## Canonical references

- Feature hub and decisions **D-TC-001**–**D-TC-004**: [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/)
- Informative mirror: repository root `ANSI.md`
- Requirement IDs **ANSI-001**–**ANSI-008**: [contracts and edge cases](./contracts-and-edge-cases/)
- Gating: [Console capabilities](/platform-spec/core-library/terminal-and-console/console-capabilities/)

## Detailed behavior

The **ANSI escape model** describes how bytes on a terminal byte stream are interpreted as control functions versus printable text. `corelib_console` maps this model to composable builders.

### Escape prefix and sequence families

All standard escape codes are introduced by **ESC** (U+001B). Equivalent literal forms include `\x1B`, `\033`, and decimal `27`.

| Family | Introducer | Role |
| --- | --- | --- |
| **ESC** | `ESC` + final byte | Single-byte controls (e.g. DEC save `ESC 7`) |
| **CSI** | `ESC [` or byte `0x9B` | Parameterized controls (cursor, erase, SGR, modes) |
| **DCS** | `ESC P` or `0x90` | Device control strings (not used in v1 corelib) |
| **OSC** | `ESC ]` or `0x9D` | Operating-system commands (title, hyperlinks subset) |

CSI parameters are semicolon-separated. Example: `\x1b[1;31m` sets bold red foreground (SGR `1` + color `31`, final byte `m`).

### General ASCII control characters

| Name | Dec | Hex | C-escape | Description |
| --- | --- | --- | --- | --- |
| BEL | 7 | 0x07 | `\a` | Terminal bell |
| BS | 8 | 0x08 | `\b` | Backspace |
| HT | 9 | 0x09 | `\t` | Horizontal tab |
| LF | 10 | 0x0A | `\n` | Line feed |
| VT | 11 | 0x0B | `\v` | Vertical tab |
| FF | 12 | 0x0C | `\f` | Form feed |
| CR | 13 | 0x0D | `\r` | Carriage return |
| ESC | 27 | 0x1B | (no portable `\e`) | Escape |
| DEL | 127 | 0x7F | — | Delete |

Stream helpers in [Console I/O streams](/platform-spec/core-library/terminal-and-console/console-io-streams/) write UTF-8 **string** bytes; control characters above are ordinary string contents at the syscall boundary.

### Cursor movement (CSI)

| Sequence | Description |
| --- | --- |
| `ESC[H` | Cursor home (1,1) |
| `ESC[{line};{column}H` or `f` | Cursor to line, column |
| `ESC[#A` | Up *#* lines |
| `ESC[#B` | Down *#* lines |
| `ESC[#C` | Right *#* columns |
| `ESC[#D` | Left *#* columns |
| `ESC[#E` | Cursor to beginning of next line, *#* lines down |
| `ESC[#F` | Cursor to beginning of previous line, *#* lines up |
| `ESC[#G` | Cursor to column *#* |
| `ESC[6n` | Request cursor position (reply `ESC[row;colR`) |
| `ESC M` | Reverse index (scroll if needed) |
| `ESC 7` / `ESC 8` | DEC save / restore cursor |
| `ESC[s` / `ESC[u` | SCO save / restore (non-normative for Beskid builders) |

`Ansi.Cursor` fluent steps map to the CSI rows above; save/restore uses **DEC** per hub decision **D-TC-001**.

### Erase functions (CSI)

| Sequence | Description |
| --- | --- |
| `ESC[J` / `ESC[0J` | Erase from cursor to end of display |
| `ESC[1J` | Erase from cursor to start of display |
| `ESC[2J` | Erase entire display |
| `ESC[3J` | Erase saved lines (scrollback) |
| `ESC[K` / `ESC[0K` | Erase from cursor to end of line |
| `ESC[1K` | Erase from start of line to cursor |
| `ESC[2K` | Erase entire line |

Erasing a line does not move the cursor; callers **should** emit `\r` when the cursor must return to column 1.

### Graphics mode (SGR, final byte `m`)

| Sequence | Reset | Description |
| --- | --- | --- |
| `ESC[0m` | — | Reset all attributes |
| `ESC[1m` | `ESC[22m` | Bold |
| `ESC[2m` | `ESC[22m` | Dim |
| `ESC[3m` | `ESC[23m` | Italic |
| `ESC[4m` | `ESC[24m` | Underline |
| `ESC[5m` | `ESC[25m` | Blink |
| `ESC[7m` | `ESC[27m` | Inverse |
| `ESC[8m` | `ESC[28m` | Hidden |
| `ESC[9m` | `ESC[29m` | Strikethrough |

`Ansi.Sgr` builds semicolon-joined parameter lists and wraps them in `EmitCsi(..., "m")`.

### Basic 8/16 colors

| Color | Foreground | Background |
| --- | --- | --- |
| Black | 30 | 40 |
| Red | 31 | 41 |
| Green | 32 | 42 |
| Yellow | 33 | 43 |
| Blue | 34 | 44 |
| Magenta | 35 | 45 |
| Cyan | 36 | 46 |
| White | 37 | 47 |
| Default | 39 | 49 |

Bright variants use codes **90–97** (foreground) and **100–107** (background), or bold+base (`1;31`) on terminals without aixterm bright codes.

### Indexed 256 and RGB

| Sequence | Role |
| --- | --- |
| `ESC[38;5;{n}m` | Foreground palette index 0–255 |
| `ESC[48;5;{n}m` | Background palette index 0–255 |
| `ESC[38;2;{r};{g};{b}m` | Foreground truecolor |
| `ESC[48;2;{r};{g};{b}m` | Background truecolor |

Index bands: **0–7** standard, **8–15** bright, **16–231** 6×6×6 cube (`16 + 36r + 6g + b`), **232–255** grayscale steps.

### Screen and private modes

Common **private** CSI modes (final `h` / `l`):

| Sequence | Description |
| --- | --- |
| `ESC[?25l` / `ESC[?25h` | Hide / show cursor |
| `ESC[?47l` / `ESC[?47h` | Restore / save screen |
| `ESC[?1049l` / `ESC[?1049h` | Disable / enable alternate buffer |

`Ansi.Screen` and `Ansi.Escape.PrivateMode` cover the subset used by corelib tests; legacy VGA resolution `ESC[={n}h` modes are documented in `ANSI.md` only.

### Corelib module map

| Module | Responsibility |
| --- | --- |
| `Ansi.Escape` | Framing, `WhenEnabled`, DEC/OSC helpers |
| `Ansi.Cursor` | Movement builder → gated sequence |
| `Ansi.Erase` | Display/line erase builder |
| `Ansi.Sgr` | Attribute and color builder with downgrade |
| `Ansi.Screen` | Scroll region and alt-screen helpers |
| `Ansi.Osc` | OSC payloads (BEL-terminated) |
| `Ansi.StyleChain` | Markup attribute chain used by `Console.Format` |

## Verification

Golden tests: `AnsiEscapeTests.bd`, `AnsiSgrGoldenTests.bd` — see [verification and traceability](./verification-and-traceability/).

## Related topics

- [Flow and algorithm](./flow-and-algorithm/) — compose, gate, write pipeline
- [Examples](./examples/) — `EmitCsi`, cursor, SGR usage
- [Console I/O streams](/platform-spec/core-library/terminal-and-console/console-io-streams/) — UTF-8 delivery to stdout
