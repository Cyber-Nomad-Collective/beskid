---
title: "Control flow"
description: if, while, for, and match, plus the scoped use statement that cleans up after you.
tableOfContents: true
---

Control flow is where a program admits it has choices. Beskid has the usual set, and one statement that most languages bolt on later.

## `if`

```beskid
if total > limit {
    return Result::Error("over limit");
} else if total == 0 {
    Output.WriteLine("nothing to do");
} else {
    Output.WriteLine("ok");
}
```

No parentheses around the condition, braces always required. The condition must be `bool`; there is no truthiness, and `if count` where `count` is an `i64` is E1208, not a shortcut.

## Loops

```beskid
mut i64 i = 0;
while i < 10 {
    i += 1;
}

for n in range(0, 10) {
    if n % 2 == 0 { continue; }
    if n > 7 { break; }
    Output.WriteLine("${n}");
}
```

`while` with a boolean condition, `for n in range(a, b)` for the half-open integer range, `break` and `continue` doing what they say. `for x in array` parses but does not lower yet, so iterate arrays by index with `range` and `Slice.Len` until it does. There is no `do ... while`, no `goto`, and no `for (init; cond; step)`; the last one exists in C-family languages because `for n in range` did not, and now it does.

## `match`

```beskid
string label = match state {
    PaymentState::Pending => "waiting",
    PaymentState::Captured(amount) when amount > 100_00 => "large",
    PaymentState::Captured(_) => "captured",
    PaymentState::Failed(reason) => "failed: ${reason}",
};
```

`match` is an expression. Every arm produces a value of the same type, and the set of arms must cover every variant of the scrutinee or the compiler refuses (E1305 for a mismatched arm type, and a non-exhaustive match is its own diagnostic). A `when` guard narrows an arm; `_` is the wildcard. Patterns destructure enum payloads by position and bind them to names.

Add a variant to `PaymentState` and every `match` that does not handle it stops compiling. That is the feature. The `switch` statement with a `default:` that logs and moves on is how a new order state silently becomes "waiting" in a report six months later.

Matching on literals works too: `match kind { "circle" => ..., "rect" => ..., _ => ... }`.

## Scoped `use`

```beskid
use Network.Tcp.TcpListener;
use Network.Tcp.TcpStream;

Result<unit, NetworkError> ServeOnce(SocketAddress address) {
    use TcpListener listener = TcpListener.Bind(address, 1_i64)?;
    use TcpStream client = listener.Accept()?;
    // ... talk to the client ...
    return Result::Ok(());
}
```

`use Type name = expr;` binds a value and guarantees `Dispose()` runs when the enclosing block exits, whether by fallthrough, `return`, or a `?` that bailed out early. Several `use` bindings dispose in reverse order, so `client` closes before `listener`. The block form `use (Type name = expr) { ... }` scopes the value to just that block.

Three rules the compiler enforces: the value must satisfy `Core.Disposable`, it must be freshly acquired in the `use` statement rather than an existing binding, and the enclosing function must return a `Result` so that a failing `Dispose` has somewhere to go. `Dispose` itself returns `Result<unit, DisposeError>`, and the first cleanup error wins if several fail. This is the statement that C# spelled `using` and Java spelled try-with-resources; Beskid puts it under the same keyword as imports because "bring this into scope" is the same idea whether the thing is a module or a file handle, and a scoped binding cannot be confused with an import because one has a type and an `=` and the other does not.

## What is not here

No exceptions, so no `throw`, and no `try` as a control-flow tool. Failures are `Result` values and chapter 09 is about them. No `async` or `await`; concurrency is `spawn`, chapter 11.

The grammar is in [lexical and syntax](/platform-spec/language-meta/surface-syntax/lexical-and-syntax/); `match` rules are in [enums and match](/platform-spec/language-meta/type-system/enums-and-match/).
