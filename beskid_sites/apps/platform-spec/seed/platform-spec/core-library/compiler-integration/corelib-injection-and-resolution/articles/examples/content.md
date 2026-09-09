import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Superrepo host app (implicit corelib)

A minimal `Project.proj` with only app dependencies still resolves standard prelude types (including Option types), strings, and fibers because `resolve_dependencies` attaches `beskid_corelib` without an explicit `Std` block.

## Explicit corelib path override

```text
dependency {
  name = Std
  source = path
  path = "../../compiler/corelib/beskid_corelib"
}
```

Used in compiler dogfood projects; must point at aggregate `Project.proj`.

## CI environment

```bash
export BESKID_CORELIB_ROOT=/path/to/compiler/corelib
beskid build --project apps/demo/Project.proj
```

Ensures consistent corelib root when not using bundled install artifacts.

## Rejected manifest (parse error)

```text
project {
  name = bad
  noCorelib = true
}
```

Fails structural validation in `reject_corelib_opt_out_keys`.
