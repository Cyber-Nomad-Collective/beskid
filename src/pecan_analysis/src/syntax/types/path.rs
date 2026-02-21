use crate::syntax::{Identifier, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Path {
    #[ast(children)]
    pub segments: Vec<Spanned<Identifier>>,
}

impl crate::parsing::parsable::Parsable for Path {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::Path {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::Path),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let segments = pair
            .into_inner()
            .map(|segment| crate::syntax::Identifier::parse(segment))
            .collect::<Result<Vec<_>, _>>()?;

        Ok(crate::syntax::Spanned::new(Self { segments }, span))
    }
}
