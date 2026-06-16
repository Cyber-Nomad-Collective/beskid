---
title: Error handling - Examples
description: Code examples showing error handling patterns in Beskid.
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

## Basic try propagation

```beskid
unit ReadFile(string path) -> Core.Results.Result<string, string> {
    let content = File.ReadAllText(path)?;
    return Core.Results.Ok(content);
}
```

## Manual match (without `?`)

```beskid
unit ReadFileManual(string path) -> Core.Results.Result<string, string> {
    let result = File.ReadAllText(path);
    match result {
        Core.Results.Ok(v) => return Core.Results.Ok(v);
        Core.Results.Error(e) => return Core.Results.Error(e);
    }
}
```

## Option for absence

```beskid
unit Find(i32[] values, i32 target) -> Core.Results.Option<i32> {
    for v in values {
        if (v == target) {
            return Core.Results.Some(v);
        }
    }
    return Core.Results.None;
}
```

## Chained `?`

```beskid
unit LoadConfig(string path) -> Core.Results.Result<Config, string> {
    let text = File.ReadAllText(path)?;
    let parsed = Parser.Parse(text)?;
    return Core.Results.Ok(parsed);
}
```
