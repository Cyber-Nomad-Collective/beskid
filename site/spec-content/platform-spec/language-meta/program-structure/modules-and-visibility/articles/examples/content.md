---
title: Modules and visibility - Examples
description: Code examples showing module and visibility patterns in Beskid.
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

## File-scoped module

```beskid
mod MyApp.Services;

pub type UserService {
    // ...
}
```

## Inline module

```beskid
mod Internal {
    type Helper {
        // private by default
    }
}
```

## Import with alias

```beskid
use MyApp.Services.UserService as Service;

unit UseService() {
    let s = Service {};
}
```

## Re-export

```beskid
mod PublicApi {
    pub use MyApp.Services.UserService;
    pub use MyApp.Models.User;
}
```

## Visibility

```beskid
mod Library {
    type InternalHelper { }          // private
    pub type PublicApi { }           // public
}
```
