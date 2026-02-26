use miette::{LabeledSpan, NamedSource, Report, SourceSpan};
use pest::error::{Error as PestError, InputLocation};
use beskid_analysis::parser::Rule;
use beskid_analysis::parsing::error::ParseError;
use beskid_analysis::syntax::SpanInfo;

fn pest_offset(err: &PestError<Rule>) -> usize {
    match err.location {
        InputLocation::Pos(pos) => pos,
        InputLocation::Span((start, _)) => start,
    }
}

fn span_to_sourcespan(span: SpanInfo) -> SourceSpan {
    let len = span.end.saturating_sub(span.start).max(1);
    SourceSpan::new(span.start.into(), len.into())
}

pub fn print_pretty_pest_error(file: &str, source: &str, err: &PestError<Rule>) {
    let report = pest_to_report(file, source, err);
    eprintln!("{:?}", report);
}

pub fn print_pretty_parse_error(file: &str, source: &str, err: &ParseError) {
    let report = parse_to_report(file, source, err);
    eprintln!("{:?}", report);
}

fn pest_to_report(file: &str, source: &str, err: &PestError<Rule>) -> Report {
    let offset = pest_offset(err);
    let span = SourceSpan::new(offset.into(), 1usize.into());
    let label = LabeledSpan::at(span, "here");
    miette::miette!(labels = vec![label], "parse error: {}", err)
        .with_source_code(NamedSource::new(file, source.to_string()))
}

fn parse_to_report(file: &str, source: &str, err: &ParseError) -> Report {
    let message = match err {
        ParseError::UnexpectedRule { expected, found, .. } => {
            match expected {
                Some(rule) => format!("expected {:?}, found {:?}", rule, found),
                None => format!("unexpected {:?}", found),
            }
        }
        ParseError::MissingPair { expected } => format!("missing {:?}", expected),
    };

    match err {
        ParseError::UnexpectedRule { span, .. } => {
            let label = LabeledSpan::at(span_to_sourcespan(*span), "here");
            miette::miette!(labels = vec![label], "parse error: {}", message)
                .with_source_code(NamedSource::new(file, source.to_string()))
        }
        ParseError::MissingPair { .. } => {
            miette::miette!("parse error: {}", message)
                .with_source_code(NamedSource::new(file, source.to_string()))
        }
    }
}
