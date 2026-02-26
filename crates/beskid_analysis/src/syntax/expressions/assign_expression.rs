use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Expression, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct AssignExpression {
    #[ast(child)]
    pub target: Box<Spanned<Expression>>,
    #[ast(child)]
    pub value: Box<Spanned<Expression>>,
}

pub(crate) fn parse_assignment_expression(
    pair: Pair<Rule>,
) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let mut inner = pair.into_inner();
    let target = Expression::parse(
        inner
            .next()
            .ok_or(ParseError::missing(Rule::LogicalOrExpression))?,
    )?;

    if let Some(value_pair) = inner.next() {
        let value = Expression::parse(value_pair)?;
        let assign = Spanned::new(
            AssignExpression {
                target: Box::new(target),
                value: Box::new(value),
            },
            span,
        );
        Ok(Spanned::new(Expression::Assign(assign), span))
    } else {
        Ok(Spanned::new(target.node, span))
    }
}
