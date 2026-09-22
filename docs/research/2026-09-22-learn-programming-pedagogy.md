# Beskid Learn programming-pedagogy research

## Decision

Every concept lesson uses **Predict → Run → Investigate → Modify → Make**
(PRIMM), a complete worked example, a near transfer edit, and a small
independent transfer. Support fades over the sequence. This keeps lessons
concrete without turning them into a prose reference or a blank-page exercise.

## Evidence-informed rules

| Finding | Curriculum rule | Source |
| --- | --- | --- |
| Worked examples followed by closely related problems and faded guidance support learning. | Start with a runnable complete example; move from labelled gaps to partial starters to a small independent program. | [What Works Clearinghouse, 2007](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) |
| Grouping steps under functional labels supports transferable subgoals. | Explain **Choose a path**, **Represent a state**, or **Wait for a result**, not only punctuation. | [Catrambone, 1998](https://doi.org/10.1037/0096-3445.127.4.355); [Margulieux et al., 2012](https://doi.org/10.1145/2361276.2361291) |
| PRIMM structures code reading into prediction, execution, explanation, modification, then creation. | Require a prediction before showing the result and an explanation before a semantic edit. | [Sentance, Waite & Kallia, 2019](https://doi.org/10.1080/08993408.2019.1608781) |
| Retrieval, explanatory questions, and corrective feedback improve durable learning. | End with a short explanation/prediction prompt, retrieve it later, and make compiler failures repairable. | [What Works Clearinghouse, 2007](https://ies.ed.gov/ncee/wwc/PracticeGuide/1); [WWC, 2019](https://ies.ed.gov/ncee/wwc/PracticeGuide/25) |
| Diagrams help when paired with concrete representations. | Draw state/timeline diagrams only for hidden state such as call flow or fiber scheduling; tie each to a code observation. | [What Works Clearinghouse, 2007](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) |

## Non-negotiable authoring rules

- State one observable outcome and the real Beskid command that observes it.
- Introduce one principal concept per lesson; declare prerequisites and
  retrieve a prior concept.
- Use the canonical spelling and a source link for each language claim.
- Distinguish **proven runnable**, **parser and analysis**, and **normative
  pending** lessons. A parseable snippet is not evidence of executable
  semantics.
- A failure clinic identifies the violated rule, narrow source area, smallest
  repair, and next command; it never says only “checks failed”.
- Fiber examples are possible traces, not timing guarantees. Never call a
  fiber a thread or teach `async`/`await` as an alias.
- Keep the Ridge Signal narrative light: examples are memorable because their
  program behaviour is visible, not because of unrelated jokes.
