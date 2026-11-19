---
title: "Inject fields"
description: Ask for dependencies with inject on a field, collect all implementations with an array, and choose the scope with global and parent.
tableOfContents: true
---

A registered type states what it needs with **`inject`** on a field. The compiler finds a matching registration and fills the field before anything runs.

```text
type Mailer
{
    inject Clock clock;
    inject Logger logger;

    pub unit Send(string to)
    {
        this.logger.Info("sending to ${to}");
        return;
    }
}
```

Each field ends with a semicolon, like every other `type` field. An injected field reads like any other field (`this.clock`), so a type whose dependencies come from the container looks the same to its own methods as a type whose fields were set by hand.

## Field injection only

`inject` belongs to **fields of ordinary types**. It is not accepted on constructor parameters (E1712). That is deliberate: dependencies do not change a type's signature as it grows, and the compiler has one place to look when it wires a service.

## One service or all of them

A singular `inject Contract field` needs exactly one registration to resolve to. A plural `inject Contract[] field` collects **every** registration for the contract:

```beskid
use Core.Collections.Array;
use Core.Output;

contract Storage
{
    string Name();
}

type FileStorage : Storage
{
    pub string Name()
    {
        return "file";
    }
}

type MemoryStorage : Storage
{
    pub string Name()
    {
        return "memory";
    }
}

type Sinks
{
    inject Storage[] storages;

    pub i64 Count()
    {
        return Array.Len<Storage>(this.storages);
    }
}

host AppHost()
{
    registry
    {
        single FileStorage for Storage;
        single MemoryStorage for Storage;
        single Sinks;
    }

    startup(Sinks sinks)
    {
        i64 count = sinks.Count();
        Output.WriteLine("storages: ${count}");
    }
}

i32 Main()
{
    launch AppHost();
    return 0;
}
```

The plural form picks up all registrations at the nearest level that has any, in the order they were registered, and it works for a contract or for a concrete type. The singular form with two candidates is E1705. The singular form with no candidate is E1704.

## Resolution order

An unqualified `inject` starts at the innermost active scope and walks outward to the host's global registry. The first level that has a match wins for a singular field. Two qualifiers change the starting point:

| Form | Where the search starts |
| --- | --- |
| `inject Logger logger` | Innermost scope, then outward to global |
| `inject global::Logger logger` | The global registry only. Named scopes are skipped. |
| `inject parent::Logger logger` | One level above the innermost scope. Global, if the innermost scope is a top-level one. |

Use `global::` when a scope registers its own `Logger` but a particular service must keep using the shared one. A qualifier that makes no sense where it is written is E1714.

Hook parameters are resolved by the same rules (see [Hooks](/book/11a-hosts-and-native-ioc/hooks/)).

## Who gets injected

Injection applies to the services that **the registry builds**. Ask for a service through a field of another registered type or through a parameter of a hook, rather than constructing it by hand and expecting the fields to fill themselves.

## A complete example

```beskid
use Core.Output;

contract Clock
{
    i64 Now();
}

type FixedClock : Clock
{
    pub i64 Now()
    {
        return 1700000000;
    }
}

contract Logger
{
    unit Info(string message);
}

type ConsoleLogger : Logger
{
    pub unit Info(string message)
    {
        Output.WriteLine(message);
        return;
    }
}

type Mailer
{
    inject Clock clock;
    inject Logger logger;

    pub unit Send(string to)
    {
        i64 now = this.clock.Now();
        this.logger.Info("sending to ${to} at ${now}");
        return;
    }
}

host AppHost()
{
    registry
    {
        single FixedClock for Clock;
        single ConsoleLogger for Logger;
        single Mailer;
    }

    startup(Mailer mailer)
    {
        mailer.Send("owner@example.com");
    }
}

i32 Main()
{
    launch AppHost();
    return 0;
}
```

If you delete the `Clock` registration, the program no longer compiles: no registration provides inject type `Clock` (E1704). The error is at the field, before any code runs.

## Next

[Scopes and with](/book/11a-hosts-and-native-ioc/scopes-and-with/)
