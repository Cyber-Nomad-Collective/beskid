---
description: Pecan Project Examples
---

# Project Examples

## Example 1: Single-project app
```
my_app/
├── project.pn
└── src/
    └── main.pn
```

**project.pn**
```pecan
unit project(b: Build) {
    b.project("MyApp", "0.1.0");
    b.set_root("src");
    let app = b.target("app", "main.pn");
    app.set_kind("app");
}
```

## Example 2: App with local dependency
```
workspace/
├── app/
│   ├── project.pn
│   └── src/
│       └── main.pn
└── std/
    ├── project.pn
    └── src/
        └── io.pn
```

**app/project.pn**
```pecan
unit project(b: Build) {
    b.project("App", "0.1.0");
    b.set_root("src");
    let std = b.dep("pecan.std", "../std");
    b.use_dep(std);
    let app = b.target("app", "main.pn");
    app.set_kind("app");
}
```

**std/project.pn**
```pecan
unit project(b: Build) {
    b.project("PecanStd", "0.1.0");
    b.set_root("src");
    let lib = b.target("lib", "io.pn");
    lib.set_kind("lib");
}
```

## Example 3: Nested module layout
```
netlib/
├── project.pn
└── src/
    ├── net.pn
    └── net/
        └── http.pn
```

**src/net.pn**
```pecan
pub mod http;
```

**src/net/http.pn**
```pecan
pub type Client { ... }
```

## Example 4: Multiple targets
```
project/
├── project.pn
└── src/
    ├── main.pn
    └── tests.pn
```

```pecan
unit project(b: Build) {
    b.project("Project", "0.2.0");
    b.set_root("src");
    let app = b.target("app", "main.pn");
    app.set_kind("app");
    let tests = b.target("tests", "tests.pn");
    tests.set_kind("test");
}
```
