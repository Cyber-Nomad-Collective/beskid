use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::items::impl_block::ImplBlock;
use crate::syntax::items::parse_helpers::{parse_attributes, parse_visibility_or_default};
use crate::syntax::{Attribute, Identifier, Node, SpanInfo, Spanned, Visibility};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct InlineModule {
    #[ast(children)]
    pub attributes: Vec<Spanned<Attribute>>,
    #[ast(child)]
    pub visibility: Spanned<Visibility>,
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub items: Vec<Spanned<Node>>,
}

impl Parsable for InlineModule {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.clone().into_inner().peekable();

        let attributes = parse_attributes(&mut inner)?;
        let visibility = parse_visibility_or_default(&pair, &mut inner)?;
        let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;

        let mut items = Vec::new();
        for item in inner {
            if item.as_rule() == Rule::Item {
                let inner_item = item
                    .clone()
                    .into_inner()
                    .next()
                    .ok_or(ParseError::missing(Rule::Item))?;

                if inner_item.as_rule() == Rule::ImplBlock {
                    let impl_block = ImplBlock::parse(inner_item)?;
                    items.extend(impl_block.node.methods.into_iter().map(|method| {
                        let span = method.span;
                        Spanned::new(Node::Method(method), span)
                    }));
                    continue;
                }
            }

            items.push(Node::parse(item)?);
        }

        Ok(Spanned::new(
            Self {
                attributes,
                visibility,
                name,
                items,
            },
            span,
        ))
    }
}
