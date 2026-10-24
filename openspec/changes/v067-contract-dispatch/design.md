# Design: contract dispatch (0.6.7)

A contract value pairs the held value with a dispatch table of the implementation that the conversion selected. The conversion happens where a concrete value meets a contract type: an assignment, an argument, a return, a field or element store, or an injection. A call on a contract value reads its table and calls the implementation with the held value as receiver. The generic bound `T: C` keeps static dispatch; a contract type used as a value type uses runtime dispatch.

Transfer class. A contract value is of Moved class, because the compiler cannot know the class of the value it holds. A Shared held value stays shared. The move and uniqueness rules of `v067-move-at-isolate-boundary` apply to a contract value that crosses.

Open items, to align with slice dyn when it reports: identity and equality of contract values, the exact coercion rules (for example between two contract types where one embeds the other), and the representation across an isolate crossing.
