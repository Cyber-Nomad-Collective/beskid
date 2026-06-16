---
title: Native dependency injection - Examples
description: Reference fixtures for hosts, plural inject, scope dispose, and library hosts.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

## Application host (`app` target)

```beskid
host AppHost(string[] args) : ConsoleHost {
    registry {
        single AppConfig for Configuration;
        single SqlStorage for Storage;
        single FileStorage for Storage;
    }

    startup(Configuration config, Storage[] storages) {
        for s in storages { s.Open(config); }
    }
}

type StorageAggregator {
    inject Configuration configuration;
    inject Storage[] storages;
}

unit Main(string[] args) {
    launch AppHost(args);
}
```

## Library host composed by app

**`Lib` project** (no `launch`):

```beskid
host InfraHost : ConsoleHost {
    registry {
        single SharedLogger for Logger;
    }
}
```

**`App` project:**

```beskid
host AppHost(string[] args) : InfraHost {
    registry {
        single AppLogger for Logger;   // overrides InfraHost Logger
    }

    startup(Logger logger) { }
}

unit Main(string[] args) {
    launch AppHost(args);
}
```

## Named scope with `init`, `dispose`, and navigation

```beskid
host AppHost(string[] args) : ConsoleHost {
    registry {
        single AppConfiguration for Configuration;
    }

    scope HttpScope(RequestContext request) {
        ScopedDbSession for DbSession;

        init(global::Configuration config, DbSession db) {
            db.Connect(config, request);
        }

        dispose(DbSession db) {
            db.Close();
        }
    }

    startup(Configuration config) { }
}

type RequestWorker {
    inject global::Configuration configuration;

    unit Run(RequestContext request) {
        with HttpScope(request) {
            Process();
        }
    }
}
```

## Plural inject vs singular error

```beskid
registry {
    single A for Provider;
    single B for Provider;
}

type Consumer {
    inject Provider[] providers;   // OK — both A and B
    // inject Provider p;          // E1705 — use array form
}
```

## Nested scopes and independent activations

```beskid
with HttpScope(request) {
    with UnitOfWork(readOnly: false) { Save(); }
}
with HttpScope(request) {
    with UnitOfWork(readOnly: true) { Query(); }   // second activation — new scoped set
}
```

> Conformance fixtures under `compiler/crates/beskid_tests` and `compiler/crates/beskid_e2e_tests` will track the reference implementation as composition analysis lands.
