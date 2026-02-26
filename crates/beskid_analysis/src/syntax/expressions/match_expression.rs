use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Expression, MatchArm, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct MatchExpression {
    #[ast(child)]
    pub scrutinee: Box<Spanned<Expression>>,
    #[ast(children)]
    pub arms: Vec<Spanned<MatchArm>>,
}

pub(crate) fn parse_match_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let mut inner = pair.into_inner();
    let scrutinee = Expression::parse(inner.next().ok_or(ParseError::missing(Rule::Expression))?)?;
    let arms = inner.map(MatchArm::parse).collect::<Result<Vec<_>, _>>()?;

    let match_expr = Spanned::new(
        MatchExpression {
            scrutinee: Box::new(scrutinee),
            arms,
        },
        span,
    );

    Ok(Spanned::new(Expression::Match(match_expr), span))
}
