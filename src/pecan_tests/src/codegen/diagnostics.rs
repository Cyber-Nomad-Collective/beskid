use pecan_analysis::syntax::SpanInfo;
use pecan_codegen::errors::CodegenError;
use pecan_codegen::diagnostics::codegen_error_to_diagnostic;

#[test]
fn maps_missing_cast_intent_to_stable_code() {
    let span = SpanInfo {
        start: 1,
        end: 2,
        line_col_start: (1, 2),
        line_col_end: (1, 3),
    };
    let error = CodegenError::MissingCastIntent {
        span,
        expected: pecan_analysis::types::TypeId(1),
        actual: pecan_analysis::types::TypeId(2),
    };
    let diagnostic = codegen_error_to_diagnostic("test.pn", "x", &error);

    assert_eq!(diagnostic.code.as_deref(), Some("E2008"));
    assert!(diagnostic.message.contains("missing cast intent"));
}

#[test]
fn maps_unsupported_node_to_stable_code() {
    let span = SpanInfo {
        start: 0,
        end: 1,
        line_col_start: (1, 1),
        line_col_end: (1, 2),
    };
    let error = CodegenError::UnsupportedNode {
        span,
        node: "expression kind",
    };
    let diagnostic = codegen_error_to_diagnostic("test.pn", "x", &error);

    assert_eq!(diagnostic.code.as_deref(), Some("E2001"));
    assert!(diagnostic.message.contains("unsupported node"));
}
