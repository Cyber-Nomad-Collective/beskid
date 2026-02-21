use crate::syntax::{Identifier, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct EnumPath {
    #[ast(child)]
    pub type_name: Spanned<Identifier>,
    #[ast(child)]
    pub variant: Spanned<Identifier>,
}

impl crate::parsing::parsable::Parsable for EnumPath {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::EnumPath {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::EnumPath),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let type_name = crate::syntax::Identifier::parse(
            inner
                .next()
                .ok_or(crate::parsing::error::ParseError::missing(
                    crate::parser::Rule::Identifier,
                ))?,
        )?;
        let variant = crate::syntax::Identifier::parse(
            inner
                .next()
                .ok_or(crate::parsing::error::ParseError::missing(
                    crate::parser::Rule::Identifier,
                ))?,
        )?;

        Ok(crate::syntax::Spanned::new(
            Self { type_name, variant },
            span,
        ))
    }
}
