export type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
};

export type LearnExerciseCategory = 'basics' | 'functions' | 'control-flow' | 'parsing' | 'runtime';

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
  questions: ReadonlyArray<Question>;
  detailedContent: string;
  prerequisites: ReadonlyArray<string>;
  category: LearnExerciseCategory;
};

export type LearnProgress = {
  exerciseId: string;
  completed: boolean;
  score: number;
  completedAt?: string;
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
    category: "basics",
    prerequisites: [],
    detailedContent: [
      "## Hello, Beskid\n",
      "Welcome to Beskid! Every Beskid program starts with a `Main` function — the entry point the compiler looks for when building your binary. Think of it as the front door to your program.\n",
      "### The Anatomy of a Minimal Program\n",
      "```beskid",
      "i32 Main() {",
      "  return 0;",
      "}",
      "```\n",
      "Breaking this down:\n",
      "- `i32` is the return type — a 32-bit signed integer. The OS expects a numeric exit code.\n",
      "- `Main()` is the function name and parameter list. Capital M is required.\n",
      "- `{ return 0; }` is the body. `return 0` signals success to the operating system.\n",
      "### What `beskid analyze` Does\n",
      "The `analyze` command parses your code, resolves names, and type-checks every expression. It won't produce a binary, but it confirms your program is well-formed.\n",
      "### Key Takeaways\n",
      "- Every Beskid program needs exactly one `Main` function\n",
      "- Return types are mandatory on all functions\n",
      "- `return 0` means \"everything went fine\"\n",
    ].join(""),
    questions: [
      {
        id: "01_q1",
        text: "Which type does the Main function return in the minimal Beskid program?",
        options: ["i64", "i32", "void", "int"],
        correctIndex: 1,
      },
      {
        id: "01_q2",
        text: "What does `beskid analyze` check?",
        options: [
          "Only syntax",
          "Only the runtime behavior",
          "Parsing, name resolution, and type-checking",
          "Only the Main function",
        ],
        correctIndex: 2,
      },
      {
        id: "01_q3",
        text: "What does `return 0` signal in the Main function?",
        options: [
          "An error occurred",
          "The program should restart",
          "Successful execution",
          "The compiler should optimize",
        ],
        correctIndex: 2,
      },
    ],
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
    category: "basics",
    prerequisites: ["01_hello_beskid"],
    detailedContent: [
      "## Values and Names\n",
      "Programs rarely work with literals alone — you need to name values so you can reuse them. Beskid uses `let` bindings for this, just like many modern languages.\n",
      "### Declaring a Value\n",
      "```beskid",
      "let name = 42;",
      "```\n",
      "The compiler infers the type from the right-hand side, so you don't need to annotate `let` bindings explicitly. Name inference is deterministic — the compiler always picks the narrowest type that fits.\n",
      "### Using Values in Conditions\n",
      "```beskid",
      "if name == 42 {",
      "  return 0;",
      "}",
      "return 1;",
      "```\n",
      "Branches must converge: every path through the function must produce an `i32` value. The compiler tracks reachability and will reject functions where a path falls off the end.\n",
      "### Key Takeaways\n",
      "- `let` creates a named, immutable binding\n",
      "- Type inference works on let bindings — no annotation needed\n",
      "- Every `if` must have its paths accounted for in the return analysis\n",
    ].join(""),
    questions: [
      {
        id: "02_q1",
        text: "How do you declare a local value in Beskid?",
        options: ["var x = 10", "let x = 10", "const x = 10", "i32 x = 10"],
        correctIndex: 1,
      },
      {
        id: "02_q2",
        text: "Do you need to annotate the type on a `let` binding?",
        options: [
          "Yes, always",
          "Only for i32 values",
          "No, the compiler infers it",
          "Only inside functions",
        ],
        correctIndex: 2,
      },
    ],
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
    category: "functions",
    prerequisites: ["02_values_and_names"],
    detailedContent: [
      "## Functions and Returns\n",
      "Functions are the building blocks of Beskid programs. Every function has an explicit return type and typed parameters — no exceptions. This discipline pays off: the compiler catches parameter mismatches before you ever run the code.\n",
      "### Defining a Function\n",
      "```beskid",
      "i32 add(i32 a, i32 b) {",
      "  return a + b;",
      "}",
      "```\n",
      "Every parameter needs its type written explicitly. The return type (`i32`) goes before the function name. Inside the body, `return` must produce a value matching that type.\n",
      "### Calling Functions\n",
      "```beskid",
      "i32 sum = add(1, 2);",
      "```\n",
      "Arguments are positional. The compiler checks that every argument's type matches the parameter declaration. No implicit conversions happen — types must line up exactly.\n",
      "### Key Takeaways\n",
      "- All function parameters require explicit types\n",
      "- Return types are mandatory and checked against every `return` statement\n",
      "- Function calls are type-checked at compile time — no runtime surprises\n",
    ].join(""),
    questions: [
      {
        id: "03_q1",
        text: "Where does the return type go in a Beskid function declaration?",
        options: [
          "After the parameter list",
          "Before the function name",
          "After the closing brace",
          "Inside the parameter list",
        ],
        correctIndex: 1,
      },
      {
        id: "03_q2",
        text: "What happens if you pass the wrong type to a function parameter?",
        options: [
          "The value is silently converted",
          "A runtime error occurs",
          "The compiler rejects the call",
          "The function returns a default value",
        ],
        correctIndex: 2,
      },
      {
        id: "03_q3",
        text: "In `i32 add(i32 a, i32 b)`, what type does the function return?",
        options: ["void", "i64", "i32", "bool"],
        correctIndex: 2,
      },
    ],
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
    category: "control-flow",
    prerequisites: ["03_functions_and_returns"],
    detailedContent: [
      "## Branches\n",
      "Real programs make decisions. Beskid's `if`/`else` is the primary control-flow tool — and the compiler enforces that every possible path produces a consistent result.\n",
      "### If / Else Basics\n",
      "```beskid",
      "if n % 2 == 0 {",
      "  return 1;",
      "} else {",
      "  return 0;",
      "}",
      "```\n",
      "The condition inside `if` must be a boolean expression. Both branches must terminate in a way that satisfies the enclosing function's return contract — either both `return`, or the whole `if`/`else` is used as an expression.\n",
      "### Exhaustive Branch Analysis\n",
      "The compiler checks that every path through a function reaches a `return` with the correct type. If you write an `if` without an `else` and the `if` body always returns, the code after the `if` is treated as the implicit else-path — and must itself return.\n",
      "### Key Takeaways\n",
      "- `if` conditions must be boolean\n",
      "- Both branches must satisfy the return type contract\n",
      "- The compiler's reachability analysis prevents \"falling off the end\" of a function\n",
    ].join(""),
    questions: [
      {
        id: "04_q1",
        text: "What type must an `if` condition evaluate to in Beskid?",
        options: ["i32", "boolean", "any type", "void"],
        correctIndex: 1,
      },
      {
        id: "04_q2",
        text: "In the `is_even` function, what happens if `n % 2 == 0` is false?",
        options: [
          "The function returns nothing",
          "The `else` branch runs and returns 0",
          "A compile error occurs",
          "The function restarts",
        ],
        correctIndex: 1,
      },
    ],
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
    category: "control-flow",
    prerequisites: ["04_branches"],
    detailedContent: [
      "## Run a Program\n",
      "Now that you can define functions and branch, it's time to combine them into a complete program. This lesson focuses on arithmetic expressions inside conditions — a pattern you'll use constantly.\n",
      "### Typed Variable Declarations\n",
      "```beskid",
      "i32 first = 1;",
      "i32 second = 2;",
      "```\n",
      "Unlike `let`, explicit type annotations on variable declarations tell both you and the compiler exactly what you expect. The right-hand side must match.\n",
      "### Arithmetic in Conditions\n",
      "```beskid",
      "if first + second == 3 {",
      "  return 0;",
      "}",
      "```\n",
      "Expressions nest naturally — `first + second` evaluates first, then `== 3` compares the result. Operator precedence follows C-like rules: arithmetic before comparison.\n",
      "### Key Takeaways\n",
      "- Explicitly typed variables with `i32 x = ...` are useful for clarity\n",
      "- Arithmetic expressions work inside `if` conditions\n",
      "- The compiler validates every expression's type before code generation\n",
    ].join(""),
    questions: [
      {
        id: "05_q1",
        text: "What is the result of `first + second == 3` when first=1 and second=2?",
        options: ["3", "true", "false", "A type error"],
        correctIndex: 1,
      },
      {
        id: "05_q2",
        text: "Which evaluates first in `first + second == 3`?",
        options: [
          "`== 3`",
          "`first + second`",
          "They evaluate simultaneously",
          "It depends on the compiler",
        ],
        correctIndex: 1,
      },
    ],
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
    category: "parsing",
    prerequisites: ["01_hello_beskid"],
    detailedContent: [
      "## Parser Basics\n",
      "Before the compiler type-checks your code, it must parse raw text into a structured tree. The `beskid parse` command lets you inspect this intermediate representation directly.\n",
      "### What Parsing Does\n",
      "The parser reads your source file character by character, groups tokens (keywords, identifiers, operators), and builds an Abstract Syntax Tree (AST). If your program has a syntax error — a missing brace, a stray character — the parser catches it here.\n",
      "### Using `beskid parse`\n",
      "```bash",
      "beskid parse path/to/program.beskid",
      "```\n",
      "On success, the command prints a normalized representation of your program. On failure, it reports the line and column of the first syntax error.\n",
      "### Normalization\n",
      "The parser also normalizes your code — removing unnecessary whitespace, standardizing formatting — so the output always looks consistent regardless of how you wrote the input.\n",
      "### Key Takeaways\n",
      "- Parsing converts text to AST — it's the first compiler phase\n",
      "- Use `beskid parse` to verify your code is syntactically valid\n",
      "- Parse errors include line/column position for quick fixes\n",
    ].join(""),
    questions: [
      {
        id: "06_q1",
        text: "What does `beskid parse` produce on success?",
        options: [
          "A binary executable",
          "A normalized AST representation",
          "Type-checking diagnostics",
          "Runtime output",
        ],
        correctIndex: 1,
      },
      {
        id: "06_q2",
        text: "What happens if your code has a missing brace?",
        options: [
          "The compiler skips the error",
          "The parser reports the syntax error with line/column",
          "The program runs anyway",
          "The error is only found at runtime",
        ],
        correctIndex: 1,
      },
      {
        id: "06_q3",
        text: "Why does the parser normalize output?",
        options: [
          "To make programs run faster",
          "To provide consistent formatting regardless of input style",
          "To hide errors",
          "To convert types automatically",
        ],
        correctIndex: 1,
      },
    ],
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
    category: "parsing",
    prerequisites: ["06_parser_basics", "04_branches"],
    detailedContent: [
      "## Inspect Syntax Tree\n",
      "Beyond parsing, `beskid tree` prints a human-readable tree view of your program's structure. This is invaluable for understanding how the compiler sees your code.\n",
      "### The Tree Command\n",
      "```bash",
      "beskid tree path/to/program.beskid",
      "```\n",
      "The output shows the AST with indentation representing nesting depth. Function declarations, parameter lists, if-expressions, and return statements are all visible nodes.\n",
      "### Reading the Tree\n",
      "Each node shows:\n",
      "- Its kind (function-decl, if-expr, return-stmt, etc.)\n",
      "- Source location (line:column span)\n",
      "- Type annotation (where resolved)\n",
      "\n",
      "### Debugging with Tree\n",
      "When a program type-checks but behaves unexpectedly, the tree view reveals whether the structure matches your intent. A misplaced `else` or a missing return shows up clearly.\n",
      "### Key Takeaways\n",
      "- `beskid tree` visualizes AST structure with indentation\n",
      "- Every node shows kind, location, and type info\n",
      "- Use tree output to debug structural misunderstandings\n",
    ].join(""),
    questions: [
      {
        id: "07_q1",
        text: "What information does each tree node display?",
        options: [
          "Only the node kind",
          "Kind, source location, and type info",
          "Only the source location",
          "Only the type annotation",
        ],
        correctIndex: 1,
      },
      {
        id: "07_q2",
        text: "How does the tree command show nesting?",
        options: [
          "With JSON brackets",
          "With color coding",
          "With indentation",
          "With line numbers",
        ],
        correctIndex: 2,
      },
    ],
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
    category: "runtime",
    prerequisites: ["05_simple_program_run"],
    detailedContent: [
      "## Run Program\n",
      "The ultimate test: compile and execute your Beskid program. `beskid run` does it all — parse, type-check, generate code, and launch the resulting binary.\n",
      "### The Run Command\n",
      "```bash",
      "beskid run path/to/program.beskid",
      "```\n",
      "Under the hood, `run` performs every compiler phase. If any phase fails, you get diagnostics. If everything succeeds, your program executes and its exit code is forwarded to the shell.\n",
      "### Exit Codes\n",
      "```beskid",
      "i32 Main() {",
      "  i32 value = 0;",
      "  return value;",
      "}",
      "```\n",
      "`return 0` means success (standard Unix convention). Any non-zero value signals an error. The shell captures this via `$?`.\n",
      "### The Compile-and-Run Pipeline\n",
      "1. **Parse** — text to AST\n",
      "2. **Resolve** — names to declarations\n",
      "3. **Type-check** — every expression validated\n",
      "4. **Codegen** — AST to native code\n",
      "5. **Execute** — the binary runs\n",
      "\n",
      "### Key Takeaways\n",
      "- `beskid run` is the full pipeline: parse → check → build → execute\n",
      "- Exit code 0 means success; non-zero means error\n",
      "- All compile-time checks still apply before execution\n",
    ].join(""),
    questions: [
      {
        id: "08_q1",
        text: "What phases does `beskid run` perform?",
        options: [
          "Only parsing",
          "Only execution",
          "Parse, type-check, codegen, and execute",
          "Only code generation",
        ],
        correctIndex: 2,
      },
      {
        id: "08_q2",
        text: "What exit code signals success in Beskid programs?",
        options: ["1", "-1", "0", "Any value"],
        correctIndex: 2,
      },
      {
        id: "08_q3",
        text: "If your program has a type error, will `beskid run` still execute it?",
        options: [
          "Yes, with a warning",
          "Yes, type errors are optional",
          "No, compilation fails and no binary is produced",
          "Only if you use a special flag",
        ],
        correctIndex: 2,
      },
    ],
  },
];

export const exerciseCount = learnExercises.length;

export function validateModeForExercise(exercise: LearnExercise): string {
  return exercise.command === "run" ? "runtime" : "compiler";
}

export const lessonGroups: Record<LearnExerciseCategory, LearnExercise[]> = {
  basics: [],
  functions: [],
  'control-flow': [],
  parsing: [],
  runtime: [],
};

for (const ex of learnExercises) {
  lessonGroups[ex.category].push(ex);
}
