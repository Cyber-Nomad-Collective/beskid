; ============================================================================
; Beskid tree-sitter highlight queries
; ============================================================================

; --- Keywords ---
; Control flow
"if" @keyword
"else" @keyword
"while" @keyword
"for" @keyword
"in" @keyword
"return" @keyword
"break" @keyword
"continue" @keyword
"match" @keyword
"when" @keyword

; Declarations
"type" @keyword
"enum" @keyword
"contract" @keyword
"host" @keyword
"mod" @keyword
"use" @keyword
"impl" @keyword
"extend" @keyword
"macro" @keyword
"test" @keyword
"attribute" @keyword

; Visibility
(visibility) @keyword

; Variables and bindings
"let" @keyword
"mut" @keyword

; Parameter modifiers
(parameter_modifier) @keyword

; Scope and lifecycle
"scope" @keyword
"spawn" @keyword
"launch" @keyword
"with" @keyword
"event" @keyword
"inject" @keyword
"registry" @keyword

; Test sections
"meta" @keyword
"skip" @keyword

; Inject qualifiers
(inject_qualifier) @keyword

; Registration lifetimes
(registration_lifetime) @keyword

; Other keywords
"as" @keyword
"range" @keyword

; Macro fragment kinds
(macro_fragment_kind) @keyword

; Wildcard pattern
(wildcard_pattern) @keyword

; --- Built-in types ---
(primitive_type) @type.builtin

; --- Types (usage) ---
(type_path) @type

; --- Type definitions (names) ---
(type_definition name: (identifier) @type.definition)
(enum_definition name: (identifier) @type.definition)
(contract_definition name: (identifier) @type.definition)
(attribute_declaration name: (identifier) @type.definition)

; --- Functions ---
(function_definition name: (identifier) @function)
(impl_method name: (identifier) @function)
(contract_method_signature name: (identifier) @function)

; --- Macros ---
(macro_definition name: (identifier) @function.macro)
(macro_invocation name: (identifier) @function.macro)

; --- Tests ---
(test_definition name: (identifier) @function.test)

; --- Variables (bindings) ---
; Let bindings
(typed_let_statement name: (identifier) @variable)
(inferred_let_statement name: (identifier) @variable)

; For-loop iterator variable
(for_statement name: (identifier) @variable)

; Lambda parameters
(lambda_parameter name: (identifier) @variable)

; With-statement bindings
(with_statement name: (identifier) @variable)

; --- Constants (enum constructors) ---
(enum_variant name: (identifier) @constant)
(enum_path) @constant

; --- Literals ---
(string_literal) @string
(string_escape) @string.escape
(char_literal) @character
(integer_literal) @number
(float_literal) @number

; Booleans
"true" @boolean
"false" @boolean

; --- Comments ---
(line_comment) @comment
(block_comment) @comment
(doc_comment) @comment.documentation

; --- String interpolation ---
(string_interpolation) @embedded

; --- Operators ---
[
  "="
  "+="
  "-="
  "==="
  "!=="
  "=="
  "!="
  "<="
  ">="
  "<"
  ">"
  "+"
  "-"
  "*"
  "/"
  "&&"
  "||"
  "!"
  "=>"
  "."
  "::"
] @operator

(try_operator) @operator

; --- Punctuation: delimiters ---
[
  ","
  ";"
  ":"
] @punctuation.delimiter

; --- Punctuation: brackets ---
[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

; --- Properties (field access / member access) ---
(member_access member: (identifier) @property)
(field_value name: (identifier) @property)
(value_field name: (identifier) @property)
(event_field name: (identifier) @property)
(inject_field name: (identifier) @property)

; --- Attributes ---
(attribute name: (identifier) @attribute)

; --- Namespaces / Modules ---
(module_declaration (identifier) @namespace)
(inline_module name: (identifier) @namespace)
(host_definition name: (identifier) @namespace)

; --- Macro metavariables ---
(macro_metavariable) @variable.builtin

; --- Labels ---
; The grammar does not currently support labeled break/continue.
; When added, capture with: (break_statement label: (identifier) @label)
