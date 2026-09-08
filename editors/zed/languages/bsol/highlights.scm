; Adapted from beskid_bsol/grammars/tree-sitter-bsol/queries/highlights.scm
; for the grammar's actual node fields and kinds.

(block (block_kind) @keyword)

(block (string) @string)

(assignment (identifier) @property)

(string) @string
(identifier) @variable
(comment) @comment

[
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

["=" ","] @operator

"@schemaless" @attribute
