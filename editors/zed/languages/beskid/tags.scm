; ============================================================================
; Beskid tree-sitter tag queries (symbol navigation)
; ============================================================================

; --- Function/Method definitions ---
(function_definition
  name: (identifier) @name) @definition.function

(impl_method
  name: (identifier) @name) @definition.function

(contract_method_signature
  name: (identifier) @name) @definition.function

(scope_hook) @definition.function

; --- Macro definitions ---
(macro_definition
  name: (identifier) @name) @definition.macro

; --- Type definitions ---
(type_definition
  name: (identifier) @name) @definition.type

(enum_definition
  name: (identifier) @name) @definition.type

(contract_definition
  name: (identifier) @name) @definition.type

(attribute_declaration
  name: (identifier) @name) @definition.type

; --- Module / Namespace definitions ---
(host_definition
  name: (identifier) @name) @definition.module

(module_declaration
  name: (_) @name) @definition.namespace

(inline_module
  name: (identifier) @name) @definition.namespace

; --- Test definitions ---
(test_definition
  name: (identifier) @name) @definition.test

; --- Import references ---
(use_declaration
  path: (_) @name) @reference.import

; --- Call references ---
(call_suffix) @reference.call

(macro_invocation) @reference.call

; --- Field references ---
(member_access
  member: (identifier) @name) @reference.field
