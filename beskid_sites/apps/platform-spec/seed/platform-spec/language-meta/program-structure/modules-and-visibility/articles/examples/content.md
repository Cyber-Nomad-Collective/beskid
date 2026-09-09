import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

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
