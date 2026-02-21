use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{SpanInfo, Spanned, Statement};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Block {
    #[ast(children)]
    pub statements: Vec<Spanned<Statement>>,
}

impl Parsable for Block {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let statements = pair
            .into_inner()
            .map(Statement::parse)
            .collect::<Result<Vec<_>, _>>()?;

        Ok(Spanned::new(Self { statements }, span))
    }
}
