# Beskid Learn: evidence-informed lesson design research

Date: 2026-09-22  
Scope: curriculum-authoring guidance for the interactive lessons under
`site/learn/curriculum/`. This is a research note, not a claim that any
particular Beskid lesson has yet been validated with learners.

## Decision

Use one consistent progression in every new concept lesson:

1. establish a concrete behaviour and one learner-visible goal;
2. ask the learner to predict the behaviour of a short, complete program;
3. run it and reconcile the result with the prediction;
4. investigate the few code parts responsible, grouped by their purpose;
5. make one constrained change with immediate compiler/runtime feedback; and
6. make a small, meaningfully different program that reuses the same concept.

This is a practical adaptation of PRIMM (Predict, Run, Investigate, Modify,
Make), supplemented with worked examples, subgoal labels, retrieval practice,
and targeted feedback. It deliberately does **not** turn each lesson into a
long prose reference or make learners type a full program before they can read
one.

## Evidence

| Finding | Authority and limits | Curriculum consequence |
| --- | --- | --- |
| A worked solution followed by a similar problem is a recommended alternative to assigning only unsolved problems. Guidance should fade as expertise grows. | The U.S. Department of Education's What Works Clearinghouse (WWC) rates interleaving worked examples and problem solving as moderate evidence, and reports that fading examples can benefit learning. [WWC practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) and [full guide, pp. 10–12](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/20072004.pdf). This is broad learning research, not a Beskid-specific trial. | Start a concept with one runnable complete example, then a near transfer edit, then an independently authored micro-program. Reduce starter-code support across the sequence. |
| Functionally grouping steps with abstract labels helps people form reusable subgoals rather than imitate surface details. | Catrambone's four experiments found that labels for groups of example steps improved subgoal formation; abstract labels were more likely to support transfer. [Catrambone, 1998](https://doi.org/10.1037/0096-3445.127.4.355). A computing-education study also found subgoal-labelled materials improved novice performance and transfer in App Inventor. [Margulieux, Guzdial & Catrambone, 2012](https://doi.org/10.1145/2361276.2361291). | Explain code under purpose labels such as **Define the value**, **Choose a path**, **Start concurrent work**, and **Wait for the result**. Labels must name an intent, not a token (avoid headings such as “The semicolon”). |
| Code reading, prediction, execution, explanation, modification, and creation can be structured as a progression rather than jumping straight to blank-page programming. | PRIMM explicitly defines Predict, Run, Investigate, Modify, and Make; its authors position the model as a programming-pedagogy framework. [Sentance, Waite & Kallia, 2019](https://doi.org/10.1080/08993408.2019.1608781). This is a framework paper, so it should guide design rather than be read as a universal effect-size guarantee. | Every lesson uses the same named stages. “Predict” requires an answer before the result is revealed; “Investigate” asks for a causal explanation; “Modify” has a bounded change; “Make” changes the program’s purpose. |
| Active retrieval with corrective feedback improves durable learning; rereading alone is weaker. The WWC also recommends spacing learning and asking explanatory questions. | The WWC gives strong evidence ratings for quiz-based re-exposure and deep explanatory questions, and advises corrective feedback when errors are expected. [WWC practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1), [retrieval and feedback discussion](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/20072004.pdf). | Include one short closed-book “explain why” or predict-the-output prompt per lesson; revisit it in a later lesson with a changed context. Reveal a concise reason after an answer, not only “correct/incorrect.” |
| Postsecondary learning technology should provide timely, targeted feedback and support self-regulated learning. | The WWC's postsecondary technology guide rates timely, targeted feedback and technology supporting self-regulated learning as moderate evidence. [WWC, 2019](https://ies.ed.gov/ncee/wwc/PracticeGuide/25). | Map expected failure states to plain-language diagnosis: show the violated rule, the relevant source region, the smallest repair, and a retry. Avoid a generic “checks failed” dead end. |
| Visual and verbal representations can be combined, and abstract concepts should be connected to concrete examples. | These are explicit WWC recommendations, with moderate evidence for combining graphics with verbal descriptions and connecting abstract and concrete representations. [WWC practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1). | Use a compact state or timeline diagram only where it makes a hidden process visible (call/return flow, branch choice, data movement, fiber scheduling). Keep it adjacent to the code it describes and state the corresponding runtime observation. |
| Parsons problems can provide an intermediate scaffold between reading and writing, but their efficacy is conditional rather than automatic. | A 2023 controlled study reports benefits from equivalent Parsons scaffolding, especially where learners can use it effectively; prior knowledge predicted better use. [Cunningham et al., 2023 preprint](https://arxiv.org/abs/2311.18115). This is a preprint and should not be treated as settled across all populations. | Use line-order or fill-the-gap activities sparingly for syntactic assembly after a full example, never as the only proof of semantic understanding; follow them with a run and a meaning-changing edit. |

## Required authoring rules

### 1. Build a prerequisite chain, not a topic list

- State a single observable outcome at the top: what the program will do and
  how the learner will verify it with the actual Beskid toolchain.
- Introduce at most one principal new programming idea per lesson. Syntax
  required to express that idea may appear, but it must be identified as
  support rather than treated as another learning objective.
- Each lesson declares prerequisites, new vocabulary, and the earlier lesson
  whose knowledge it retrieves. Fibers must therefore follow functions,
  values, control flow, calls, and error/result handling—not merely be placed
  later by theme.
- Use a small recurring project narrative so examples have a reason to exist,
  but keep each compiler-checked exercise independently runnable.

### 2. Use the six-stage lesson shape

```text
Hook / goal       A concrete outcome and why it matters.
Predict            Learner records an output, exit code, state change, or error.
Run                The exact Beskid command produces the observation.
Investigate        A short worked example, annotated by functional subgoals.
Modify             One constrained edit; starter code removes irrelevant work.
Make + retrieve    A small transfer task plus one explanation/review prompt.
```

- Do not disclose the prediction result in the prompt itself.
- Keep the worked program complete, executable, and no longer than necessary
  to demonstrate the target behaviour.
- Make tasks change *meaning*, not just identifiers or whitespace.
- Place the reference solution behind an explicit reveal or after an earnest
  attempt; explain the critical decisions rather than dumping code alone.

### 3. Explain semantics before jargon, with accurate vocabulary attached

- Start from “what changes when this runs?” and then attach the Beskid term.
  Example: “A fiber is independently schedulable work; `spawn` creates it.”
- Define each new term once in learner language, then use the official spelling
  consistently. Add the term to the project glossary when it becomes part of
  the curriculum’s stable language.
- Narrate cause and effect line by line only for the lines relevant to the
  target concept. Explain non-obvious compiler constraints as rules with a
  demonstrated counterexample.
- For concurrency, distinguish a deterministic teaching trace from a general
  scheduling guarantee. Never imply an execution order that the language does
  not promise.

### 4. Make feedback instructional

- A check must correspond to the stated outcome. Prefer actual `analyze`,
  `parse`, `tree`, or `run` evidence over a text-only completion marker.
- On failure, identify the observable mismatch, explain the relevant language
  rule, point to the narrowest source location, and suggest the next action.
- Include purposeful “broken but plausible” examples for common misconceptions
  only when the learner can run, read, and repair them in the same lesson.
- Do not assess hidden concepts: each acceptance condition must have appeared
  in an example or a prior prerequisite.

### 5. Engineer retention and transfer across the curriculum

- End every lesson with one retrieval question requiring a prediction or
  explanation. Multiple choice is acceptable only when its feedback explains
  every plausible misconception; it is not the main assessment.
- At the start of each later context, include a short cumulative task that
  combines an old concept with the new one. Vary names, values, and story
  context so learners choose the idea rather than copy a pattern.
- Fade scaffolds: complete code → labelled gaps/Parsons ordering where useful →
  partial starter → blank small program.
- Reserve capstones for a coherent behaviour that needs several concepts, and
  decompose their check output into recoverable milestones.

### 6. Keep entertainment in service of comprehension

- Use a consistent, lightly playful world and observable artifacts (status
  code, quest log, worker roster) instead of jokes between every line of code.
- A hook earns its place only if it creates a question answered by the target
  concept. Examples should be memorable *because the program’s behaviour is
  visible*.
- Keep prose short around a runnable experiment. A lesson is comprehensive
  when it covers mechanism, boundary, failure mode, and transfer—not when it
  has the most paragraphs.

## Proposed quality gate for each lesson

Before publishing a lesson, an author can answer “yes” to all of these:

- Is the learner goal observable with a concrete Beskid command?
- Does the lesson have a prediction before result, a runnable example, a
  purposeful explanation, a constrained edit, and a transfer task?
- Are code explanations grouped by goal and free of unjustified claims about
  execution order, types, ownership, or fibers?
- Does the exercise check the same behaviour that the prose teaches?
- Does feedback make a failed attempt repairable without revealing the full
  solution immediately?
- Does one retrieval item revisit an earlier concept or set up a later one?
- Is any diagram necessary for a hidden relationship, and is it tied to an
  actual code observation?

## Source-selection notes

The WWC sources are U.S. Department of Education evidence syntheses and are
used for general instructional-design claims. PRIMM, subgoal labelling, and the
Parsons study supply programming-education-specific support. The evidence does
not establish that one lesson template works identically for every age,
background, accessibility need, or programming language. The curriculum should
therefore retain learner telemetry and qualitative feedback as a later
validation loop, while keeping this template as the initial, evidence-informed
standard.
