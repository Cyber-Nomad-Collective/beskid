use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Identifier, SpanInfo, Spanned};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct ContractEmbedding {
    #[ast(child)]
    pub name: Spanned<Identifier>,
}

impl Parsable for ContractEmbedding {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let name = Identifier::parse(
            pair.into_inner()
                .next()
                .ok_or(ParseError::missing(Rule::Identifier))?,
        )?;

        Ok(Spanned::new(Self { name }, span))
    }
}
