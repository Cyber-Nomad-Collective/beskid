# Design: host composition (0.6.7)

## Hook lowering

Expansion lowers each hook of a top-level host to a private function and, when the hook has parameters, to a private argument type whose `inject` fields mirror the parameters. The ordinary graph resolves, orders and diagnoses the hook parameters (E1704, E1705 at the parameter). A `launch` reaches every generated hook function of its unit.

## Order

Launch runs global `init`, then `startup`. `with` runs scope `init` after the scope is entered. Leaving a scope by any exit runs scope `dispose` before the scope is left. The end of the launch lifetime runs global `dispose` before the container shuts down. Across a host chain `init` and `startup` run base host first; `dispose` runs the launched host first.

## Services

The container creates a registered service without a constructor, so a registered service may have only `inject` fields. The check covers types of the analysed unit; imported types are not checked.

## Archive notes

The delta for `console-hosting` is a new capability and cannot carry a Purpose header. At archive time the capability spec SHALL get this Purpose, because `validate-standard` fails on a TBD Purpose: "This specification defines the built-in console host base of Corelib. Programs inherit it to read the command line without writing registrations."

## Open gap

The requirement "Launch and with arguments" is in scope for 0.6.7 by owner ruling. Slice host is implementing it; task 2.3 stays open until the slice reports. Service keys compare by full declaration identity, and slice host is changing the implementation from last-segment matching.
