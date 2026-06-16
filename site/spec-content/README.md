# Normative platform spec (submodule)

Canonical JSON workspace for [spec.beskid-lang.org](https://spec.beskid-lang.org).

- **Remote:** [Cyber-Nomad-Collective/beskid_normative_spec](https://github.com/Cyber-Nomad-Collective/beskid_normative_spec)
- **Superrepo path:** `site/spec-content`

## Checkout

```bash
git submodule update --init site/spec-content
```

Until the normative remote is fully populated, the superrepo may vendor this tree from
`beskid_normative_spec/` or bootstrap via:

```bash
bun run spec init --from-mdx site/website/src/content/docs/platform-spec
```

## Authoring

From the Beskid superrepo root:

```bash
bun run spec validate
bun run spec new node -t Feature --slug platform-spec/<domain>/<area>/<feature>
```

Local reader:

```bash
SPEC_LOCAL_WORKSPACE=site/spec-content bun run --cwd site/platform-spec dev
```

The legacy root path `beskid_normative_spec/` is deprecated in favor of `site/spec-content`.
