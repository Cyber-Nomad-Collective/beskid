---
title: Testing - Examples
description: Code examples showing test declarations in Beskid.
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

## Basic test

```beskid
test AdditionWorks {
    let result = 2 + 2;
    Assert.Equal(4, result);
}
```

## Test with metadata

```beskid
test SlowDatabaseQuery {
    meta { timeout = 30; }
    let rows = Database.Query("SELECT * FROM users");
    Assert.GreaterThan(0, rows.Length);
}
```

## Conditional skip

```beskid
test WindowsOnlyFeature {
    skip { platform = "windows"; }
    let handle = WinApi.CreateWindow();
    Assert.NotNull(handle);
}
```

## Multiple tests in one file

```beskid
test EmptyArray {
    let arr = i32[] {};
    Assert.Equal(0, arr.Length);
}

test ArrayAppend {
    let arr = i32[] { 1, 2 };
    // arr.Append(3);
    // Assert.Equal(3, arr.Length);
}
```
