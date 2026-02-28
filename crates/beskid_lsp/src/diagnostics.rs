use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::parsing::error::ParseError;
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::projects::{ProjectError, parse_manifest};
use beskid_analysis::syntax::Program;
use beskid_analysis::{AnalysisOptions, SemanticDiagnostic, Severity, builtin_rules, run_rules};
use pest::Parser;
use pest::error::{Error as PestError, InputLocation};
use tower_lsp_server::ls_types::*;

use crate::position::offset_range_to_lsp;

pub fn analyze_document(uri: &Uri, source: &str) -> Vec<Diagnostic> {
    if is_project_manifest_uri(uri) {
        return analyze_project_manifest(source);
    }

    let mut pairs = match BeskidParser::parse(Rule::Program, source) {
        Ok(pairs) => pairs,
        Err(err) => return vec![pest_error_to_lsp_diagnostic(source, &err)],
    };

    let Some(pair) = pairs.next() else {
        return vec![simple_error(
            "parse",
            "No program found",
            Range::new(Position::new(0, 0), Position::new(0, 0)),
        )];
    };

    let program = match Program::parse(pair) {
        Ok(program) => program,
        Err(err) => return vec![parse_error_to_lsp_diagnostic(source, &err)],
    };

    run_rules(
        &program.node,
        uri.to_string(),
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    )
    .diagnostics
    .into_iter()
    .map(|diag| semantic_to_lsp_diagnostic(source, diag))
    .collect()
}

fn semantic_to_lsp_diagnostic(source: &str, diag: SemanticDiagnostic) -> Diagnostic {
    let start = diag.span.offset();
    let len = diag.span.len();
    let end = start.saturating_add(len.max(1));
    Diagnostic {
        range: offset_range_to_lsp(source, start, end),
        severity: Some(match diag.severity {
            Severity::Error => DiagnosticSeverity::ERROR,
            Severity::Warning => DiagnosticSeverity::WARNING,
            Severity::Note => DiagnosticSeverity::INFORMATION,
        }),
        code: diag.code.map(NumberOrString::String),
        source: Some("beskid".to_string()),
        message: diag.message,
        ..Diagnostic::default()
    }
}

fn analyze_project_manifest(source: &str) -> Vec<Diagnostic> {
    match parse_manifest(source) {
        Ok(_) => Vec::new(),
        Err(error) => vec![project_error_to_lsp_diagnostic(error)],
    }
}

fn project_error_to_lsp_diagnostic(error: ProjectError) -> Diagnostic {
    Diagnostic {
        range: Range::new(Position::new(0, 0), Position::new(0, 1)),
        severity: Some(DiagnosticSeverity::ERROR),
        code: Some(NumberOrString::String("project".to_string())),
        source: Some("beskid".to_string()),
        message: error.to_string(),
        ..Diagnostic::default()
    }
}

fn is_project_manifest_uri(uri: &Uri) -> bool {
    uri.to_string().to_lowercase().ends_with(".proj")
}

fn pest_error_to_lsp_diagnostic(source: &str, err: &PestError<Rule>) -> Diagnostic {
    let start = match err.location {
        InputLocation::Pos(pos) => pos,
        InputLocation::Span((start, _)) => start,
    };
    let end = start.saturating_add(1);
    simple_error(
        "parse",
        &format!("parse error: {err}"),
        offset_range_to_lsp(source, start, end),
    )
}

fn parse_error_to_lsp_diagnostic(source: &str, err: &ParseError) -> Diagnostic {
    match err {
        ParseError::UnexpectedRule {
            expected,
            found,
            span,
        } => {
            let message = match expected {
                Some(rule) => format!("parse error: expected {rule:?}, found {found:?}"),
                None => format!("parse error: unexpected {found:?}"),
            };
            simple_error(
                "parse",
                &message,
                offset_range_to_lsp(source, span.start, span.end),
            )
        }
        ParseError::MissingPair { expected } => simple_error(
            "parse",
            &format!("parse error: missing {expected:?}"),
            Range::new(Position::new(0, 0), Position::new(0, 0)),
        ),
    }
}

fn simple_error(code: &str, message: &str, range: Range) -> Diagnostic {
    Diagnostic {
        range,
        severity: Some(DiagnosticSeverity::ERROR),
        code: Some(NumberOrString::String(code.to_string())),
        source: Some("beskid".to_string()),
        message: message.to_string(),
        ..Diagnostic::default()
    }
}
