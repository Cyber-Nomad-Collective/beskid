use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PrimitiveType {
    Bool,
    I32,
    I64,
    U8,
    F64,
    Char,
    String,
    Unit,
}

impl crate::parsing::parsable::Parsable for PrimitiveType {
    fn parse(
        pair: pest::iterators::Pair<crate::parser::Rule>,
    ) -> Result<crate::syntax::Spanned<Self>, crate::parsing::error::ParseError> {
        if pair.as_rule() != crate::parser::Rule::PrimitiveType {
            return Err(crate::parsing::error::ParseError::unexpected_rule(
                pair,
                Some(crate::parser::Rule::PrimitiveType),
            ));
        }

        let span = crate::syntax::SpanInfo::from_span(&pair.as_span());
        let node = match pair.as_str() {
            "bool" => Self::Bool,
            "i32" => Self::I32,
            "i64" => Self::I64,
            "u8" => Self::U8,
            "f64" => Self::F64,
            "char" => Self::Char,
            "string" => Self::String,
            "unit" => Self::Unit,
            _ => {
                return Err(crate::parsing::error::ParseError::unexpected_rule(
                    pair,
                    Some(crate::parser::Rule::PrimitiveType),
                ));
            }
        };

        Ok(crate::syntax::Spanned::new(node, span))
    }
}
