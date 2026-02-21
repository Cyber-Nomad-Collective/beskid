use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{SpanInfo, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, Copy, PartialEq, Eq)]
pub struct BreakStatement;

impl Parsable for BreakStatement {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        Ok(Spanned::new(Self, span))
    }
}
