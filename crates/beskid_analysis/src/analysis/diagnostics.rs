#![allow(unused_assignments)]

use miette::{Diagnostic, NamedSource, SourceSpan};
use thiserror::Error;

use crate::syntax::SpanInfo;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Error,
    Warning,
    Note,
}

#[derive(Error, Diagnostic, Debug, Clone)]
#[error("{message}")]
pub struct SemanticDiagnostic {
    #[source_code]
    pub src: NamedSource<String>,
    #[label("{label}")]
    pub span: SourceSpan,
    pub message: String,
    pub label: String,
    #[help]
    pub help: Option<String>,
    pub code: Option<String>,
    pub severity: Severity,
}

pub fn span_to_sourcespan(span: SpanInfo) -> SourceSpan {
    let len = span.end.saturating_sub(span.start).max(1);
    SourceSpan::new(span.start.into(), len.into())
}

pub fn make_diagnostic(
    source_name: &str,
    source: &str,
    span: SpanInfo,
    message: impl Into<String>,
    label: impl Into<String>,
    help: Option<String>,
    code: Option<String>,
    severity: Severity,
) -> SemanticDiagnostic {
    SemanticDiagnostic {
        src: NamedSource::new(source_name, source.to_string()),
        span: span_to_sourcespan(span),
        message: message.into(),
        label: label.into(),
        help,
        code,
        severity,
    }
}

#[macro_export]
macro_rules! diag {
    ($ctx:expr, $span:expr, $code:expr, $message:expr $(, label = $label:expr)? $(, help = $help:expr)? $(, severity = $severity:expr)? ) => {{
        let label = $crate::diag!(@label $( $label )?);
        let help = $crate::diag!(@help $( $help )?);
        let severity = $crate::diag!(@severity $( $severity )?);
        let diagnostic = $crate::analysis::diagnostics::make_diagnostic(
            $ctx.source_name(),
            $ctx.source(),
            $span,
            $message,
            label,
            help,
            Some($code.to_string()),
            severity,
        );
        $ctx.emit(diagnostic);
    }};
    (@label $label:expr) => { $label };
    (@label) => { "here" };
    (@help $help:expr) => { Some($help.to_string()) };
    (@help) => { None };
    (@severity $severity:expr) => { $severity };
    (@severity) => { $crate::analysis::diagnostics::Severity::Error };
}
