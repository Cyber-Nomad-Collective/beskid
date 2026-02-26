use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct GroupedExpression {
    #[ast(child)]
    pub expr: Box<Spanned<Expression>>,
}

pub(crate) fn parse_grouped_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let inner = pair
        .into_inner()
        .next()
        .ok_or(ParseError::missing(Rule::Expression))?;
    let expr = Expression::parse(inner)?;
    let grouped = Spanned::new(GroupedExpression { expr: Box::new(expr) }, span);

    Ok(Spanned::new(Expression::Grouped(grouped), span))
}
