use crate::syntax::{Identifier, Spanned, Type};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct PathSegment {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(children)]
    pub type_args: Vec<Spanned<Type>>,
}

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct Path {
    #[ast(children)]
    pub segments: Vec<Spanned<PathSegment>>,
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
            .map(|segment| {
                let mut inner = segment.into_inner();
                let name = crate::syntax::Identifier::parse(
                    inner
                        .next()
                        .ok_or(crate::parsing::error::ParseError::missing(
                            crate::parser::Rule::Identifier,
                        ))?,
                )?;
                let mut type_args = Vec::new();
                if let Some(args) = inner.next() {
                    for arg in args.into_inner() {
                        type_args.push(Type::parse(arg)?);
                    }
                }
                let segment_span = name.span;
                Ok(crate::syntax::Spanned::new(
                    PathSegment { name, type_args },
                    segment_span,
                ))
            })
            .collect::<Result<Vec<_>, _>>()?;

        Ok(crate::syntax::Spanned::new(Self { segments }, span))
    }
}
