use crate::syntax::{Identifier, ParameterModifier, Spanned, Type};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Parameter {
    #[ast(child)]
    pub modifier: Option<Spanned<ParameterModifier>>,
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(child)]
    pub ty: Spanned<Type>,
}

impl crate::parsing::parsable::Parsable for Parameter {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::Parameter {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::Parameter),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.into_inner();
        let first = inner
            .next()
            .ok_or(crate::parsing::error::ParseError::missing(
                crate::parser::Rule::Identifier,
            ))?;

        let (modifier, name_pair) = if first.as_rule() == crate::parser::Rule::ParameterModifier {
            let modifier = crate::syntax::ParameterModifier::parse(first)?;
            let name_pair = inner
                .next()
                .ok_or(crate::parsing::error::ParseError::missing(
                    crate::parser::Rule::Identifier,
                ))?;
            (Some(modifier), name_pair)
        } else {
            (None, first)
        };

        let (name, ty) = if name_pair.as_rule() == crate::parser::Rule::Identifier {
            let name = crate::syntax::Identifier::parse(name_pair)?;
            let ty = crate::syntax::Type::parse(
                inner
                    .next()
                    .ok_or(crate::parsing::error::ParseError::missing(
                        crate::parser::Rule::BeskidType,
                    ))?,
            )?;
            (name, ty)
        } else {
            let ty = crate::syntax::Type::parse(name_pair)?;
            let name = crate::syntax::Identifier::parse(
                inner
                    .next()
                    .ok_or(crate::parsing::error::ParseError::missing(
                        crate::parser::Rule::Identifier,
                    ))?,
            )?;
            (name, ty)
        };

        Ok(crate::syntax::Spanned::new(
            Self { modifier, name, ty },
            span,
        ))
    }
}
