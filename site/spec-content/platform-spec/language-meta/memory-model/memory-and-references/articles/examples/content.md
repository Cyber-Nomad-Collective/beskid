---
title: Memory and references - Examples
description: Code examples showing memory and reference patterns in Beskid.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Mutable local

```beskid
unit Counter() {
    mut i64 count = 0;
    count = count + 1;
}
```

## Inferred mutable local

```beskid
unit InferredMut() {
    let mut total = 0;
    total = total + 10;
}
```

## Mutable parameter

```beskid
unit Bump(mut i64 value) {
    value = value + 1;
}
```

## Array allocation

```beskid
unit Arrays() {
    u8[] buf = __array_new(1, 4);
    buf[0] = 1;
}
```

## Cross-fiber channel

```beskid
unit FiberShare() {
    let ch = Channel.New<i64>();
    spawn {
        ch.Send(42);
    };
    let value = ch.Receive();
}
```
