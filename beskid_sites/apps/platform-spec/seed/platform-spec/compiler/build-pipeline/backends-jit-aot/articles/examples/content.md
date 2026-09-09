import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



- **`beskid run` success:** JIT compiles and runs `main`, returning a formatted value string.
- **`beskid build --kind exe`:** AOT emits object, prepares runtime artifacts, then links executable.
- **`beskid build --kind object`:** AOT stops after object emission and skips link stage.
- **Bad entrypoint:** backend reports entrypoint resolution/signature diagnostic.
