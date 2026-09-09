(block (block_kind) @keyword)

(block (string) @string)

(assignment (identifier) @property)
(attribute_arg (identifier) @property)
(map_entry (identifier) @property)

(attribute (identifier) @attribute)
(schemaless) @attribute

(string) @string
(schemaless_text) @string
(bool_literal) @boolean
(decimal_unsigned) @number
(type_expression) @type
(ref_literal) @variable.special
(identifier) @variable
(comment) @comment

["{" "}" "[" "]" "(" ")"] @punctuation.bracket
["=" "," "@" "/" "|"] @operator
