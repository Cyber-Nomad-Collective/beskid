(block (block_kind) @keyword)

(block (string) @string)

(assignment (identifier) @property)

(string) @string
(identifier) @variable
(comment) @comment

["{" "}" "[" "]"] @punctuation.bracket
["=" ","] @operator
"@schemaless" @attribute
