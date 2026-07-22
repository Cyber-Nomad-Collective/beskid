export type LearnExercise = {
  id: string;
  title: string;
  objective: string;
  slug: string;
  starterCode: string;
  command: string;
  expectedOutput?: string;
  hints: Array<string>;
  lessonPath: string;
  difficulty: "beginner" | "intermediate";
};

export const learnExercises: ReadonlyArray<LearnExercise> = [
  {
    id: "01_hello_beskid",
    title: "Hello, Beskid",
    slug: "01-hello-beskid",
    objective:
      "Write the smallest valid Beskid program and confirm it parses and type checks with `beskid analyze`.",
    starterCode: [
      "i32 Main() {",
      "  return 0;",
      "}",
    ].join("\n"),
    command: "analyze",
    hints: [
      "Use `i32 Main()` as the entry point.",
      "Return a compile-valid value for a simple entry function.",
    ],
    lessonPath: "/site/learn/curriculum/01-hello-beskid/lesson.md",
    difficulty: "beginner",
  },
  {
    id: "02_values_and_names",
    title: "Values and Names",
    slug: "02-values-and-names",
    objective:
      "Declare and re-use a local value with a typed return to validate name binding and branch shape.",
    starterCode: [
      "i32 Main() {",
      "  let name = 42;",
      "  if name == 42 {",
      "    return 0;",
      "  }",
      "  return 1;",
      "}",
    ].join("\n"),
    command: "analyze",
    hints: [
      "Use `let` for local bindings.",
      "Keep branch conditions in a way that produces a consistent `i32` return.",
    ],
    lessonPath: "/site/learn/curriculum/02-values-and-names/lesson.md",
    difficulty: "beginner",
  },
  {
    id: "03_functions_and_returns",
    title: "Functions and Returns",
    slug: "03-functions-and-returns",
    objective:
      "Define and call a typed function from `Main` so the compiler checks parameter and return contracts.",
    starterCode: [
      "i32 add(i32 a, i32 b) {",
      "  return a + b;",
      "}",
      "",
      "i32 Main() {",
      "  i32 sum = add(1, 2);",
      "  if sum == 3 {",
      "    return 0;",
      "  }",
      "  return 1;",
      "}",
    ].join("\n"),
    command: "analyze",
    hints: [
      "Use `i32` for parameter and function return types.",
      "Return consistently from both branches in `Main`.",
    ],
    lessonPath: "/site/learn/curriculum/03-functions-and-returns/lesson.md",
    difficulty: "beginner",
  },
  {
    id: "04_branches",
    title: "Branches",
    slug: "04-branches",
    objective:
      "Use `if` / `else` to branch behavior and keep both paths returning a value the compiler can accept.",
    starterCode: [
      "i32 is_even(i32 n) {",
      "  if n % 2 == 0 {",
      "    return 1;",
      "  } else {",
      "    return 0;",
      "  }",
      "}",
      "",
      "i32 Main() {",
      "  i32 value = is_even(3);",
      "  return value;",
      "}",
    ].join("\n"),
    command: "analyze",
    hints: [
      "Keep both branch bodies returning the same type (`i32`).",
      "Use one `return` path value per branch in helper functions.",
    ],
    lessonPath: "/site/learn/curriculum/04-branches/lesson.md",
    difficulty: "intermediate",
  },
  {
    id: "05_simple_program_run",
    title: "Run a Program",
    slug: "05-simple-program-run",
    objective:
      "Combine variables and arithmetic in a complete program and validate compiler guarantees.",
    starterCode: [
      "i32 Main() {",
      "  i32 first = 1;",
      "  i32 second = 2;",
      "  if first + second == 3 {",
      "    return 0;",
      "  }",
      "  return 1;",
      "}",
    ].join("\n"),
    command: "analyze",
    hints: [
      "Use arithmetic and `if` branches with explicit return values.",
      "Keep your `Main` body deterministic and side-effect free until runtime checks are available.",
    ],
    lessonPath: "/site/learn/curriculum/05-simple-program-run/lesson.md",
    difficulty: "intermediate",
  },
  {
    id: "06_parser_basics",
    title: "Parser Basics",
    slug: "06-parser-basics",
    objective:
      "Use `beskid parse` to verify a minimal program parses and normalizes correctly.",
    starterCode: [
      "i32 Main() {",
      "  return 42;",
      "}",
    ].join("\n"),
    command: "parse",
    hints: [
      "Keep a valid `Main` shape while testing parser acceptance.",
      "`parse` verifies grammar without requiring full elaborated type diagnostics.",
    ],
    lessonPath: "/site/learn/curriculum/06-parser-basics/lesson.md",
    difficulty: "beginner",
  },
  {
    id: "07_tree_view",
    title: "Inspect Syntax Tree",
    slug: "07-tree-view",
    objective:
      "Use `beskid tree` to inspect normalized program structure from the command surface.",
    starterCode: [
      "i32 is_positive(i32 value) {",
      "  if value > 0 {",
      "    return 1;",
      "  }",
      "  return 0;",
      "}",
      "",
      "i32 Main() {",
      "  return is_positive(7);",
      "}",
    ].join("\n"),
    command: "tree",
    hints: [
      "Keep branch and helper functions syntactically consistent.",
      "This lesson validates structural output from the tree command.",
    ],
    lessonPath: "/site/learn/curriculum/07-tree-view/lesson.md",
    difficulty: "intermediate",
  },
  {
    id: "08_run_program",
    title: "Run Program",
    slug: "08-run-program",
    objective:
      "Execute code with `beskid run` and confirm the binary path validates a clean exit.",
    starterCode: [
      "i32 Main() {",
      "  i32 value = 0;",
      "  return value;",
      "}",
    ].join("\n"),
    command: "run",
    hints: [
      "Keep `Main` deterministic and side-effect free for predictable process exit.",
      "A zero return value indicates success.",
    ],
    lessonPath: "/site/learn/curriculum/08-run-program/lesson.md",
    difficulty: "intermediate",
  },
];

export const exerciseCount = learnExercises.length;

export function validateModeForExercise(exercise: LearnExercise): string {
  return exercise.command === "run" ? "runtime" : "compiler";
}
