use crate::syntax::{Path, PrimitiveType, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub enum Type {
    #[ast(child)]
    Primitive(Spanned<PrimitiveType>),
    #[ast(child)]
    Complex(Spanned<Path>),
    #[ast(child)]
    Array(Box<Spanned<Type>>),
    #[ast(child)]
    Ref(Box<Spanned<Type>>),
}

impl crate::parsing::parsable::Parsable for Type {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());

        let node = match pair.as_rule() {
            crate::parser::Rule::PecanType => {
                let inner = pair
                    .into_inner()
                    .next()
                    .ok_or(crate::parsing::error::ParseError::missing(
                        crate::parser::Rule::TypeName,
                    ))?;
                let inner_type = Self::parse(inner)?;
                return Ok(crate::syntax::Spanned::new(inner_type.node, span));
            }
            crate::parser::Rule::TypeName => {
                let mut inner = pair.into_inner();
                let first = inner
                    .next()
                    .ok_or(crate::parsing::error::ParseError::missing(
                        crate::parser::Rule::PrimitiveType,
                    ))?;

                match first.as_rule() {
                    crate::parser::Rule::PrimitiveType => {
                        let primitive = crate::syntax::PrimitiveType::parse(first)?;
                        Self::Primitive(primitive)
                    }
                    crate::parser::Rule::Path => {
                        let path = crate::syntax::Path::parse(first)?;
                        Self::Complex(path)
                    }
                    _ => {
                        return Err(crate::parsing::error::ParseError::unexpected_rule(
                            first,
                            Some(crate::parser::Rule::TypeName),
                        ))
                    }
                }
            }
            crate::parser::Rule::ArrayType => {
                let mut inner = pair.into_inner();
                let type_name = inner
                    .next()
                    .ok_or(crate::parsing::error::ParseError::missing(
                        crate::parser::Rule::TypeName,
                    ))?;
                let inner_type = Self::parse(type_name)?;
                Self::Array(Box::new(inner_type))
            }
            crate::parser::Rule::TypeReference => {
                let mut inner = pair.into_inner();
                let type_name = inner
                    .next()
                    .ok_or(crate::parsing::error::ParseError::missing(
                        crate::parser::Rule::TypeName,
                    ))?;
                let inner_type = Self::parse(type_name)?;
                Self::Ref(Box::new(inner_type))
            }
            crate::parser::Rule::PrimitiveType => {
                let primitive = crate::syntax::PrimitiveType::parse(pair)?;
                Self::Primitive(primitive)
            }
            crate::parser::Rule::Path => {
                let path = crate::syntax::Path::parse(pair)?;
                Self::Complex(path)
            }
            _ => {
                return Err(crate::parsing::error::ParseError::unexpected_rule(
                    pair,
                    Some(crate::parser::Rule::PecanType),
                ))
            }
        };

        Ok(crate::syntax::Spanned::new(node, span))
    }
}
