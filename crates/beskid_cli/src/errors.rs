use beskid_analysis::SemanticDiagnostic;
use beskid_analysis::parser::Rule;
use beskid_analysis::parsing::error::ParseError;
use beskid_analysis::services;
use miette::Report;
use pest::error::Error as PestError;

pub fn print_pretty_pest_error(file: &str, source: &str, err: &PestError<Rule>) {
    let diagnostic = services::pest_error_diagnostic(file, source, err);
    eprintln!("{:?}", Report::new(diagnostic));
}

pub fn print_pretty_parse_error(file: &str, source: &str, err: &ParseError) {
    let diagnostic = services::parse_error_diagnostic(file, source, err);
    eprintln!("{:?}", Report::new(diagnostic));
}

pub fn print_semantic_diagnostics(diagnostics: impl IntoIterator<Item = SemanticDiagnostic>) {
    for diagnostic in diagnostics {
        eprintln!("{:?}", Report::new(diagnostic));
    }
}
