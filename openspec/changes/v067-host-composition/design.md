# Design: host composition (0.6.7)

## Hook lowering

Expansion lowers each hook of a top-level host to a private function and, when the hook has parameters, to a private argument type whose `inject` fields mirror the parameters. The ordinary graph resolves, orders and diagnoses the hook parameters (E1704, E1705 at the parameter). A `launch` reaches every generated hook function of its unit.

## Order

Launch runs global `init`, then `startup`. `with` runs scope `init` after the scope is entered. Leaving a scope by any exit runs scope `dispose` before the scope is left. The end of the launch lifetime runs global `dispose` before the container shuts down. Across a host chain `init` and `startup` run base host first; `dispose` runs the launched host first.

## Services

The container creates a registered service without a constructor, so a registered service may have only `inject` fields. The check covers types of the analysed unit; imported types are not checked.

## Open gap

Slice host reports that `launch` and `with` arguments are not yet typed by the semantic layer and that hook bodies see only injected parameters. The requirement "Launch and with arguments" states the target behavior of the owner ruling. The implementation gap is recorded as an open task.
