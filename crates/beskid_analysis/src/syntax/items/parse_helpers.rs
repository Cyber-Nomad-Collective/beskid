use pest::iterators::{Pair, Pairs};
use std::iter::Peekable;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Field, Identifier, Parameter, SpanInfo, Spanned, Visibility};

pub(crate) fn parse_visibility_or_default(
    pair: &Pair<Rule>,
    inner: &mut Peekable<Pairs<Rule>>,
) -> Result<Spanned<Visibility>, ParseError> {
    if let Some(next) = inner.peek()
        && next.as_rule() == Rule::Visibility {
            return Visibility::parse(inner.next().expect("visibility pair"));
        }

    Ok(Spanned::new(
        Visibility::Private,
        SpanInfo::from_span(&pair.as_span()),
    ))
}

pub(crate) fn parse_identifier_list(
    pair: Pair<Rule>,
) -> Result<Vec<Spanned<Identifier>>, ParseError> {
    pair.into_inner().map(Identifier::parse).collect()
}

pub(crate) fn parse_parameter_list(
    pair: Pair<Rule>,
) -> Result<Vec<Spanned<Parameter>>, ParseError> {
    pair.into_inner().map(Parameter::parse).collect()
}

pub(crate) fn parse_field_list(pair: Pair<Rule>) -> Result<Vec<Spanned<Field>>, ParseError> {
    pair.into_inner().map(Field::parse).collect()
}
