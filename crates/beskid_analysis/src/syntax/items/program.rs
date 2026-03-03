use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::items::impl_block::ImplBlock;
use crate::syntax::{Node, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Program {
    #[ast(children)]
    pub items: Vec<Spanned<Node>>,
}

impl Parsable for Program {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut items = Vec::new();

        for item in pair.into_inner().filter(|item| item.as_rule() != Rule::EOI) {
            let item_candidate = if item.as_rule() == Rule::Item {
                item
                    .clone()
                    .into_inner()
                    .next()
                    .ok_or(ParseError::missing(Rule::Item))?
            } else {
                item.clone()
            };

            if item_candidate.as_rule() == Rule::ImplBlock {
                let impl_block = ImplBlock::parse(item_candidate)?;
                items.extend(
                    impl_block
                        .node
                        .methods
                        .into_iter()
                        .map(|method| {
                            let span = method.span;
                            Spanned::new(Node::Method(method), span)
                        }),
                );
                continue;
            }

            items.push(Node::parse(item)?);
        }

        Ok(Spanned::new(Self { items }, span))
    }
}
