---
title: Name resolution - Examples
description: Code examples showing name resolution patterns in Beskid.
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

## Basic resolution

```beskid
unit Main() {
    let x = 42;
    Console.WriteLine(x);   // resolves local x
}
```

## Import and alias

```beskid
use MyApp.Models.User;
use MyApp.Services.UserService as Service;

unit UseImports() {
    let u = User {};
    let s = Service {};
}
```

## Shadowing

```beskid
unit Shadow() {
    let x = 10;
    {
        let x = 20;   // shadows outer x; W1103 warned
        Console.WriteLine(x);   // 20
    }
    Console.WriteLine(x);   // 10
}
```

## Contract namespace

```beskid
contract Math {
    i32 Abs(i32 value);
}

unit UseNamespace() {
    let n = Math.Abs(-5);   // resolves through contract namespace
}
```

## Qualified path

```beskid
unit Qualified() {
    let u = MyApp.Models.User {};   // fully qualified path
}
```
