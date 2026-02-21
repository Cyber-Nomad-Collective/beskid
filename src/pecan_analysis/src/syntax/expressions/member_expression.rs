use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Identifier, SpanInfo, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct MemberExpression {
    #[ast(child)]
    pub target: Box<Spanned<Expression>>,
    #[ast(child)]
    pub member: Spanned<Identifier>,
}

pub(crate) fn parse_member_expression(
    target: Spanned<Expression>,
    pair: Pair<Rule>,
) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let member = pair
        .into_inner()
        .next()
        .ok_or(ParseError::missing(Rule::Identifier))?;
    let member = Identifier::parse(member)?;

    let member_expr = Spanned::new(
        MemberExpression {
            target: Box::new(target),
            member,
        },
        span,
    );

    Ok(Spanned::new(Expression::Member(member_expr), span))
}
