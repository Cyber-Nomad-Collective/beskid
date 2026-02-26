use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Pattern, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct MatchArm {
    #[ast(child)]
    pub pattern: Spanned<Pattern>,
    #[ast(child)]
    pub guard: Option<Spanned<Expression>>,
    #[ast(child)]
    pub value: Spanned<Expression>,
}

impl Parsable for MatchArm {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let pattern = Pattern::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Pattern))?,
        )?;
        let mut guard = None;
        let mut value_pair = None;

        for item in inner {
            match item.as_rule() {
                Rule::MatchGuard => {
                    let expr_pair = item
                        .into_inner()
                        .next()
                        .ok_or(ParseError::missing(Rule::Expression))?;
                    guard = Some(Expression::parse(expr_pair)?);
                }
                Rule::Expression => value_pair = Some(item),
                _ => return Err(ParseError::unexpected_rule(item, None)),
            }
        }

        let value = Expression::parse(
            value_pair.ok_or(ParseError::missing(Rule::Expression))?,
        )?;

        Ok(Spanned::new(Self { pattern, guard, value }, span))
    }
}
