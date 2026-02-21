use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Node, SpanInfo, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Program {
    #[ast(children)]
    pub items: Vec<Spanned<Node>>,
}

impl Parsable for Program {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let items = pair
            .into_inner()
            .filter(|item| item.as_rule() != Rule::EOI)
            .map(Node::parse)
            .collect::<Result<Vec<_>, _>>()?;

        Ok(Spanned::new(Self { items }, span))
    }
}
