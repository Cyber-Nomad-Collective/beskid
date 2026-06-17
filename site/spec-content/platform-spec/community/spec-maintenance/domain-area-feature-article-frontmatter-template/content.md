---
title: Domain, Area, Feature, and Article frontmatter templates
description: Canonical frontmatter templates aligned with platform-spec
  validators and Zod contracts.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

Use these templates when creating new platform-spec nodes. They match current CI validators and `trudoc` Zod contracts.

## Domain template

```yaml
---
title: <Domain title>
description: <Domain summary>
specLevel: domain
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Area template

```yaml
---
title: <Area title>
description: <Area summary>
specLevel: area
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Feature hub template

```yaml
---
title: <Feature title>
description: <Feature summary>
specLevel: feature
status: Standard
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Article template

```yaml
---
title: <Article title>
description: <Article summary>
specLevel: article
status: Standard
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Validation notes

- `status` is required for `feature` and `article`.
- `status` is not allowed on `domain` or `area`.
- `owner` and `submitter` must include non-empty `name` and valid `email`.
- Use `layout.json` for every domain/area/feature hub directory.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-META-0001`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
