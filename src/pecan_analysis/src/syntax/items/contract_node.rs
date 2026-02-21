use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{ContractEmbedding, ContractMethodSignature, SpanInfo, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub enum ContractNode {
    #[ast(child)]
    MethodSignature(Spanned<ContractMethodSignature>),
    #[ast(child)]
    Embedding(Spanned<ContractEmbedding>),
}

impl Parsable for ContractNode {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        parse_contract_node(pair)
    }
}

fn parse_contract_node(pair: Pair<Rule>) -> Result<Spanned<ContractNode>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());

    match pair.as_rule() {
        Rule::ContractItem => {
            let inner = pair
                .into_inner()
                .next()
                .ok_or(ParseError::missing(Rule::ContractItem))?;
            parse_contract_node(inner)
        }
        Rule::ContractMethodSignature => {
            let node = ContractMethodSignature::parse(pair)?;
            Ok(Spanned::new(ContractNode::MethodSignature(node), span))
        }
        Rule::ContractEmbedding => {
            let node = ContractEmbedding::parse(pair)?;
            Ok(Spanned::new(ContractNode::Embedding(node), span))
        }
        _ => Err(ParseError::unexpected_rule(pair, Some(Rule::ContractItem))),
    }
}
