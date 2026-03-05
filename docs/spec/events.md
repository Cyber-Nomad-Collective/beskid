# Events (Zero-Cost Multicast)

## Model
Events provide multicast subscription with static, allocation-aware lowering.

## 16.1 Declaration form
Events are declared as type fields with explicit inline capacity.

```beskid
type Window {
    pub event[4] OnResize: (i32, i32) -> unit,
}
```

Rules:
- `event[N]` requires a compile-time positive capacity,
- event signature is a function type,
- event members are part of type layout via lowering expansion.

## 16.2 Subscription model
- `+=` adds a handler.
- `-=` removes a handler.
- handlers must match event signature.

Invocation rule:
- only the owning type implementation may invoke the event (`this.EventName(...)`).

## 16.3 Lowering contract
Events do not lower to a general-purpose runtime event object.
They lower to structural fields in HIR/type layout:
- `__<EventName>_count`
- `__<EventName>_handlers: [FatPointer; N]`

Invocation lowers to static conditional dispatch up to `N`.

## 16.4 Performance and safety goals
- predictable bounded dispatch,
- no hidden per-invocation heap allocation,
- closure/lambda handlers respect capture non-escape constraints.

## 16.5 Diagnostics
Compile-time diagnostics include:
- capacity errors,
- signature mismatch on subscription,
- illegal invocation from non-owner scope,
- unsupported escaping capture patterns.
