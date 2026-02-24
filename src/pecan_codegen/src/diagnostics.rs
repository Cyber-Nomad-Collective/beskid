use pecan_analysis::analysis::diagnostics::{make_diagnostic, SemanticDiagnostic, Severity};
use pecan_analysis::syntax::SpanInfo;

use crate::errors::CodegenError;

const CODEGEN_ERROR_PREFIX: &str = "E20";

pub fn codegen_error_to_diagnostic(
    source_name: &str,
    source: &str,
    error: &CodegenError,
) -> SemanticDiagnostic {
    match error {
        CodegenError::UnsupportedNode { span, node } => make_diagnostic(
            source_name,
            source,
            *span,
            format!("unsupported node for codegen: {node}"),
            "unsupported node",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}01")),
            Severity::Error,
        ),
        CodegenError::UnsupportedFeature(feature) => make_diagnostic(
            source_name,
            source,
            default_span(),
            format!("unsupported feature during codegen: {feature}"),
            "unsupported feature",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}02")),
            Severity::Error,
        ),
        CodegenError::MissingSymbol(symbol) => make_diagnostic(
            source_name,
            source,
            default_span(),
            format!("missing symbol during codegen: {symbol}"),
            "missing symbol",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}03")),
            Severity::Error,
        ),
        CodegenError::MissingResolvedValue { span } => make_diagnostic(
            source_name,
            source,
            *span,
            "missing resolved value entry during codegen",
            "missing resolved value",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}04")),
            Severity::Error,
        ),
        CodegenError::MissingLocalType { span } => make_diagnostic(
            source_name,
            source,
            *span,
            "missing local type information during codegen",
            "missing local type",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}05")),
            Severity::Error,
        ),
        CodegenError::InvalidLocalBinding { span } => make_diagnostic(
            source_name,
            source,
            *span,
            "invalid local binding during codegen",
            "invalid local binding",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}06")),
            Severity::Error,
        ),
        CodegenError::MissingExpressionType { span } => make_diagnostic(
            source_name,
            source,
            *span,
            "missing expression type information during codegen",
            "missing expression type",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}07")),
            Severity::Error,
        ),
        CodegenError::MissingCastIntent {
            span,
            expected,
            actual,
        } => make_diagnostic(
            source_name,
            source,
            *span,
            format!(
                "missing cast intent for numeric mismatch (expected {expected:?}, actual {actual:?})"
            ),
            "missing cast intent",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}08")),
            Severity::Error,
        ),
        CodegenError::InvalidCastIntent { span, message } => make_diagnostic(
            source_name,
            source,
            *span,
            format!("invalid cast intent: {message}"),
            "invalid cast intent",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}09")),
            Severity::Error,
        ),
        CodegenError::TypeMismatch {
            span,
            expected,
            actual,
        } => make_diagnostic(
            source_name,
            source,
            *span,
            format!("type mismatch during codegen (expected {expected:?}, actual {actual:?})"),
            "type mismatch",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}10")),
            Severity::Error,
        ),
        CodegenError::VerificationFailed { function, message } => make_diagnostic(
            source_name,
            source,
            default_span(),
            format!("CLIF verification failed for `{function}`: {message}"),
            "codegen verification failed",
            None,
            Some(format!("{CODEGEN_ERROR_PREFIX}11")),
            Severity::Error,
        ),
    }
}

pub fn codegen_errors_to_diagnostics(
    source_name: &str,
    source: &str,
    errors: &[CodegenError],
) -> Vec<SemanticDiagnostic> {
    errors
        .iter()
        .map(|error| codegen_error_to_diagnostic(source_name, source, error))
        .collect()
}

fn default_span() -> SpanInfo {
    SpanInfo {
        start: 0,
        end: 0,
        line_col_start: (1, 1),
        line_col_end: (1, 1),
    }
}
