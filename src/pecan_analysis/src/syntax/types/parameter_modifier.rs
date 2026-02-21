use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, Copy, PartialEq, Eq)]
pub enum ParameterModifier {
    Ref,
    Out,
}

impl crate::parsing::parsable::Parsable for ParameterModifier {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::ParameterModifier {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::ParameterModifier),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let node = match pair.as_str() {
            "ref" => Self::Ref,
            "out" => Self::Out,
            _ => {
                return Err(crate::parsing::error::ParseError::unexpected_rule(
                    pair,
                    Some(crate::parser::Rule::ParameterModifier),
                ))
            }
        };

        Ok(crate::syntax::Spanned::new(node, span))
    }
}
