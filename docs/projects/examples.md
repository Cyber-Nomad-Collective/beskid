---
description: Pecan Project Examples (HCL)
---

# Project Examples

## Example 1: Single-project app
```
MyApp/
├── Project.proj
└── Src/
    └── Main.pn
```

**Project.proj**
```hcl
project {
  name    = "MyApp"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = "App"
  entry = "Main.pn"
}
```

## Example 2: App with local dependency
```
Workspace/
├── App/
│   ├── Project.proj
│   └── Src/
│       └── Main.pn
└── Std/
    ├── Project.proj
    └── Src/
        └── IO.pn
```

**App/Project.proj**
```hcl
project {
  name    = "App"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = "App"
  entry = "Main.pn"
}

dependency "Std" {
  source = "path"
  path   = "../Std"
}
```

**Std/Project.proj**
```hcl
project {
  name    = "Std"
  version = "0.1.0"
  root    = "Src"
}

target "Library" {
  kind  = "Lib"
  entry = "IO.pn"
}
```

## Example 3: Nested module layout
```
NetLib/
├── Project.proj
└── Src/
    ├── Net.pn
    └── Net/
        └── Http.pn
```

**Project.proj**
```hcl
project {
  name    = "NetLib"
  version = "0.1.0"
  root    = "Src"
}

target "Library" {
  kind  = "Lib"
  entry = "Net.pn"
}
```

**Src/Net.pn**
```pecan
pub mod Http;
```

**Src/Net/Http.pn**
```pecan
pub type Client { ... }
```

## Example 4: Multiple targets
```
Project/
├── Project.proj
└── Src/
    ├── Main.pn
    └── Tests.pn
```

```hcl
project {
  name    = "Project"
  version = "0.2.0"
  root    = "Src"
}

target "App" {
  kind  = "App"
  entry = "Main.pn"
}

target "Tests" {
  kind  = "Test"
  entry = "Tests.pn"
}
```
