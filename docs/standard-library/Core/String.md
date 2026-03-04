# Core.String

## Purpose
Provide UTF-8 string APIs with predictable cost.

## MVP surface
- `String.Len(string text) -> i64`
- `String.IsEmpty(string text) -> bool`
- `String.Contains(string text, string needle) -> bool`

## Constraints
- No hidden expensive behavior in cheap-looking calls.
- Allocation behavior should be explicit in API docs.
