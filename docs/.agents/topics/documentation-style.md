# Documentation style

How Beskid prose is written and where each kind of text belongs.

## Where text goes

| Kind of text | Place | Authority |
| --- | --- | --- |
| Rules of the language and platform | `openspec/specs/` | Normative |
| Explanations, tutorials, the Book | `site/website/src/content/docs/` | Informative, links to the standard |
| Canonical terms | `docs/glossary-wiki/keywords/` (GitHub wiki) | Informative |
| Agent knowledge | `docs/.agents/` | Informative, agent-written |
| Dated research and session notes | `docs/research/`, `docs/superpowers/` | Evidence, may be stale |
| Change history | `CHANGELOG.md` (Keep a Changelog) | Informative |

The Book never defines a rule. When it states one, it links to the standard.

## Tone

- No emoji anywhere.
- Follow the Beskid Book tone; the reference is
  `site/website/src/content/docs/book/00-why-beskid-exists/`. Direct, dry,
  slightly sarcastic about industry habits, never vague.
- Prefer practical deploy and container guidance over abstraction.
- Normative text stays plain. Humour belongs in the Book, not in SHALL
  statements.

## Terms

Use the spellings and terms in the glossary wiki. Write `beskid` for the tool and
Beskid for the language and project; never `beschid`.

## Licensing of prose

Prose in `docs/`, `openspec/` and `site/website/src/content/` is CC-BY-4.0
unless a file says otherwise. Code examples are Apache-2.0.
