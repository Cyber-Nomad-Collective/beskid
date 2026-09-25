---
title: "Errors and Result"
description: "Recoverable failure is a value. Result<T, E>, the ? operator, and error enums that name what went wrong."
tableOfContents: true
---

Beskid does not have exceptions. There is no `throw`, no `catch` as control flow, no stack unwinding through eleven frames to a handler that logs "an error occurred" and retries. A function that can fail says so in its return type, and the caller has to look.

```beskid
pub enum Result<TValue, TError> {
    Ok(TValue value),
    Error(TError error),
}
```

That is `Core.Results.Result`, an ordinary enum. `Ok` carries the value, `Error` carries the failure, and `match` forces you to handle both.

## Name the failure

```beskid
pub enum ConfigError {
    Missing(string path),
    Malformed(string path, i64 line),
    ValueOutOfRange(string key),
}

pub Result<Config, ConfigError> Load(string path) {
    Result<string, FsError> text = FS.ReadAllText(path);
    return match text {
        Result::Error(_) => Result::Error(ConfigError::Missing(path)),
        Result::Ok(content) => Parse(path, content),
    };
}
```

An error enum per domain, with variants that carry the facts a caller needs. `ConfigError::Malformed("app.bsol", 14)` tells the caller what to print. A `string` error tells them nothing they can branch on, and an exception type hierarchy tells them a class name. Write the enum. It costs four lines and every caller for the life of the codebase gets to `match` on it.

## `?` moves the error for you

```beskid
Result<Server, StartupError> Start(string configPath) {
    Config config = Load(configPath)?;
    TcpListener listener = TcpListener.Bind(config.address, 16_i64)?;
    return Result::Ok(Server { config: config, listener: listener });
}
```

`expr?` on a `Result` unwraps `Ok` and continues, or returns the `Error` from the enclosing function immediately. The enclosing function's error type has to be able to hold it, and E1222 tells you when it cannot. That constraint is the whole design: the error travels, but only through functions whose signatures admit it. A `unit Main()` cannot `?` anything, and a `Result<T, ConfigError>` cannot `?` a `NetworkError` without translating it first.

The translation is a `match` at the boundary, and the boundary is where you want it: the place where a low-level failure becomes a fact the next layer cares about. The corelib does this at every package edge. `Http.Errors.FromIoError` turns an `IoError` into an `HttpError`, and `Core.IO.FromDisposeError` turns a cleanup failure into an I/O one. Application code does the same thing at module edges.

## Helpers

`Core.Results` ships `Success`, `Failure`, `IsOk`, `IsError`, and `Map`. They are ordinary Beskid functions. `Results.Success<i64, string>(42_i64)` is the same value as `Result::Ok(42_i64)` with the type arguments spelled out for the cases where inference has nothing to go on.

## Non-blocking operations

Channels, mutexes, and sockets have `Try*` variants that can succeed, fail, or say "not now". That is a third outcome, so it gets a third variant:

```beskid
pub enum TryResult<TValue, TError> {
    Ok(TValue value),
    Err(TError error),
    WouldBlock,
}
```

`Concurrency.TryResult` exists because `Option<Result<T, E>>` is a lie in three parts and everyone reading it has to remember which `None` means what.

## What not to do

Do not model absence as failure. `FindUser` returns `Option<User>`. `LoadUser` returns `Result<User, StorageError>`. The first one says "no such user" and that is a normal answer. The second one says "I could not find out", and that is not.

Do not reach for panic when a `Result` will do. The next page in this chapter is about when panic is correct, and the list is short.

The normative rules are in the standard's [error handling](/platform-spec/language-meta/contracts-and-effects/error-handling/) feature.
