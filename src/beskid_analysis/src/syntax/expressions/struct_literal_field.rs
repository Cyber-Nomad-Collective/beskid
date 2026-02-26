use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Identifier, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct StructLiteralField {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(child)]
    pub value: Spanned<Expression>,
}

impl Parsable for StructLiteralField {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let name = Identifier::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Identifier))?,
        )?;
        let value = Expression::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Expression))?,
        )?;

        Ok(Spanned::new(Self { name, value }, span))
    }
}
