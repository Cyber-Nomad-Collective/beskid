use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct ReturnStatement {
    #[ast(child)]
    pub value: Option<Spanned<Expression>>,
}

impl Parsable for ReturnStatement {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let value = pair
            .into_inner()
            .next()
            .map(Expression::parse)
            .transpose()?;

        Ok(Spanned::new(Self { value }, span))
    }
}
