use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct RangeExpression {
    #[ast(child)]
    pub start: Spanned<Expression>,
    #[ast(child)]
    pub end: Spanned<Expression>,
}

impl Parsable for RangeExpression {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let start = Expression::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Expression))?,
        )?;
        let end = Expression::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Expression))?,
        )?;

        Ok(Spanned::new(Self { start, end }, span))
    }
}
