use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Literal, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct LiteralExpression {
    #[ast(child)]
    pub literal: Spanned<Literal>,
}

pub(crate) fn parse_literal_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let literal = Literal::parse(pair)?;
    let literal_expr = Spanned::new(LiteralExpression { literal }, span);

    Ok(Spanned::new(Expression::Literal(literal_expr), span))
}
