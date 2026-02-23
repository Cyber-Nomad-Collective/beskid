---
description: Name mangling specification
---

# Name mangling specification

## Decision summary
- Mangling is **always applied**.
- **Type parameters** are included in the mangled signature.
- The prefix is **`pn::`**.

## Format
```
pn::<module_path>::<item_name>$<kind>(<param_types>,<return_type>)
```

### Examples
- Function: `pn::net.http::connect$function(i64,str,Result[str])`
- Method: `pn::net.http::Client::connect$method(self,Url,Result[str])`
- Generic: `pn::collections::Map::insert$method(self,K,V,Option[V])`

## Module path rules
- `src/net/http.pn` -> `net.http`
- `src/net/http/client.pn` -> `net.http.client`

## Type encoding
- `i64`, `f64`, `bool`, `str`, `ptr`, `unit` are literal tokens.
- Generic params use their identifier (`K`, `V`, `T`).
- Composite types:
  - `Option[T]` -> `Option[T]`
  - `Result[T,E]` -> `Result[T,E]`
  - `Array[T]` -> `Array[T]`

## Rationale
- Always-on mangling avoids symbol collisions across modules.
- Type parameters in signature allow monomorphized symbols to coexist.
- `pn::` prefix ensures a unique namespace for linking.
