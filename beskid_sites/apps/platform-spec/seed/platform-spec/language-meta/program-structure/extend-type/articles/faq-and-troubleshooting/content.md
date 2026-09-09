import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## FAQ

### Can I extend a type from another package?

Yes, if the type is imported and public. `extend type` does not bypass visibility rules.

### Can I extend a generic type?

Not in v0.1. Extensions target concrete types only.

### What is the difference between `extend type` and `impl`?

`extend type` is the normative syntax. `impl` blocks remain parse-compatible during migration but should not be used in new code.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1511** | `extend type` accessing private member |
| Unknown type | Extended type name typo or missing import |
| Ambiguous method | Two extensions define the same method name |
