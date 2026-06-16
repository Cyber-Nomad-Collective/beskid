---
title: Types - Examples
description: Code examples showing Beskid type declarations, generics, arrays,
  and references.
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

## Primitive types

```beskid
unit Primitives() {
    let b = true;
    let n = 42;
    let big = 9007199254740992i64;
    let byte = 0u8;
    let pi = 3.14;
    let c = 'a';
    let s = "hello";
}
```

## Nominal record type

```beskid
type Person {
    string name;
    i32 age;
}

type Team {
    string name;
    Person[] members;
}
```

## Generic type

```beskid
type Box<T> {
    T value;
}

type Pair<T, U> {
    T first;
    U second;
}
```

## Enum with payloads

```beskid
enum Option<T> {
    Some(T);
    None;
}

enum Result<TValue, TError> {
    Ok(TValue);
    Error(TError);
}
```

## Conformance list

```beskid
contract Named {
    string Name();
}

type Product : Named {
    string name;
    f32 price;

    pub string Name() {
        return name;
    }
}
```

## Array and reference

```beskid
unit Process(ref i32[] values) {
    for v in values {
        // v is i32 by value from iteration
    }
}
```

## Function type

```beskid
type Calculator {
    (i32, i32) => i32 add;
}
```
