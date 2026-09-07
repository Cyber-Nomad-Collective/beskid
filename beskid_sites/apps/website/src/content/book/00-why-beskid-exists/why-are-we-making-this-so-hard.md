---
title: "Why are we making this so hard?"
description: Most software is business records with lipstick—and the industry sells cathedrals to serve them.
tableOfContents: true
---

Strip the keynote slides. Most Enterprise "platforms" are **glorified Excel tables with a nice UI**.

## The actual business stack

| What marketing says | What you maintain |
| --- | --- |
| Digital transformation | CRUD + workflows |
| AI-powered insights | SQL + a chart |
| Event-sourced mesh | `status` column + outbox table |
| Microservices | One service per tab on the admin panel |
| Platform team | Kubernetes YAML and a broken staging env |


![marketing](https://cdn.prod.website-files.com/69c22acabeee399088a91a06/69d97cf0f7c2440a1feabd65_marketing_team_meme.jpeg)

The hard part is rarely **algorithms**. It is:

- **Permissions** nobody documented
- **State machines** spread across three handlers
- **Reports** that must match finance's spreadsheet (the real source of truth)
- **Integrations** with vendors who treat webhooks as optional

## Why we still build cathedrals

Because **complexity sells**:

- Consultancies bill by **transformation**.
- Vendors bill by **seat** and **tier**.
- Hiring managers signal maturity with **buzzwords**.
- Developers protect craft pride with **patterns** (see [1.4 SOLID, DRY, and DDD](/book/00-why-beskid-exists/solid-dry-and-ddd/)).

![Sales pitch — complexity sells](https://i.ytimg.com/vi/BWKOVX-74Z0/maxresdefault.jpg)

Quick realization times do not favor **deleting layers**. They favor **adding another service** so this quarter's roadmap turns green.

## Engineering theatre vs shipping rows

**Theatre:** eighteen interfaces to save one row.

**Shipping:** one transaction, one audit log, one email, go home.

![That would be great — ship the row](https://media.giphy.com/media/2si2On9NsGOYxk0g58/giphy.gif)

Beskid is not anti-structure. It is anti-**structure you cannot see in the build artifact**. If your architecture only exists in PowerPoint, it is not architecture—it is fan fiction.


## The boring bar Beskid sets

- Make **common business software** expressible without importing a religion.
- Prefer **compile-time clarity** over runtime mystery.
- Keep tooling fast enough that **CI and local dev** stay honest.

If your problem is genuinely novel—finite element solvers, game engines, codecs—use Rust, C++, or Zig and be happy. Beskid is not auditioning for that job.

![Noted — use the right tool](https://i.imgflip.com/7vcab7.jpg)

Next: [1.9 Conclusion](/book/00-why-beskid-exists/conclusion/).
