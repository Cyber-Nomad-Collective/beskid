# Design: semantic diagnostics (0.6.7)

## Internal-error floor

Every internal error is one coded diagnostic at the construct. The message has the shape "internal compiler error: <summary in words>; please report this". The label is "the compiler failed here". The help names the issue tracker and the internal reason. A failure without a site renders at the start of the entry unit with the label "while compiling this program". An invalid CLIF block is the user error E1232, not an internal error.

## E1214

One diagnostic per binding, anchored at the declaration name. Each assignment is a related location labelled "assigned again". The help writes the declaration with `mut`. The fix inserts `mut ` before the type of a typed local or a parameter, or after `let`; it is machine-applicable. A `for` iterator gets the help without a fix.

## Trap name

Trap 9 is the generic trap for a Never value, an explicit trap, a failed assertion and a fatal timer. It is named `panic`. The runtime manifest is the source; the generated ABI files and the runtime kits are regenerated with the official generator.
