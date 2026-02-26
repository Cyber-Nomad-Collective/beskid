use crate::syntax::{Identifier, Spanned, Type};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Field {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(child)]
    pub ty: Spanned<Type>,
}

impl crate::parsing::parsable::Parsable for Field {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::Field {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::Field),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let ty = crate::syntax::Type::parse(
            inner
                .next()
                .ok_or(crate::parsing::error::ParseError::missing(
                    crate::parser::Rule::BeskidType,
                ))?,
        )?;
        let name = crate::syntax::Identifier::parse(
            inner
                .next()
                .ok_or(crate::parsing::error::ParseError::missing(
                    crate::parser::Rule::Identifier,
                ))?,
        )?;

        Ok(crate::syntax::Spanned::new(Self { name, ty }, span))
    }
}
