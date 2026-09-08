; Zed exposes non-private captures as ZED_CUSTOM_<capture> task variables.

(
  (test_definition
    name: (identifier) @test) @run
  (#set! tag beskid-test)
)

(
  (function_definition
    return_type: (primitive_type)
    name: (identifier) @entrypoint
    body: (block)) @run
  (#eq? @entrypoint "Main")
  (#set! tag beskid-entry)
)
