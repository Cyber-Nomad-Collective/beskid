# Design: contract dispatch (0.6.7)

A contract value pairs the held value with a dispatch table of the implementation that the conversion selected. The conversion happens where a concrete value meets a contract type: an assignment, an argument, a return, a field or element store, or an injection. A call on a contract value reads its table and calls the implementation with the held value as receiver. The generic bound `T: C` keeps static dispatch; a contract type used as a value type uses runtime dispatch.

Representation. A contract value is a managed box that holds the receiver word and a witness table (the implementation table of `C` for the implementing type). The box is an ordinary record for the collector and for isolate transit. A scalar receiver dispatches through a thunk that narrows the receiver word. A call may bypass the box when the implementing type is statically proven.

Transfer class. The class of a contract type comes from the transfer markers it embeds (none: Never, `Copied` only: Copied, other: Moved). The move and uniqueness rules of `v067-move-at-isolate-boundary` apply to a contract value that crosses.

Rulings built by slice dyn: embedding conversion re-boxes with the table of the implementing type for the embedded contract; `==` and `!=` compare the implementing type tag and the held value, and strings compare by identity as in C#; conditional branches, match arms, block results and lambda bodies are conversion sites, and the forwarding expressions themselves never convert, so no value is boxed twice.

Known gaps for integration: tests for per-scope binding of a singular inject and for `inject Greeter[]`; generic contracts (`Reader<E>`) are implemented but untested.
