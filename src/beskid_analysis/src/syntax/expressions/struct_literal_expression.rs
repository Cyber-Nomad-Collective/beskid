use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Path, SpanInfo, Spanned, StructLiteralField};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct StructLiteralExpression {
    #[ast(child)]
    pub path: Spanned<Path>,
    #[ast(children)]
    pub fields: Vec<Spanned<StructLiteralField>>,
}

pub(crate) fn parse_struct_literal_expression(
    pair: Pair<Rule>,
) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let mut inner = pair.into_inner();
    let path = Path::parse(
        inner
            .next()
            .ok_or(ParseError::missing(Rule::Path))?,
    )?;
    let fields = if let Some(field_list) = inner.next() {
        field_list
            .into_inner()
            .map(StructLiteralField::parse)
            .collect::<Result<Vec<_>, _>>()?
    } else {
        Vec::new()
    };

    let literal = Spanned::new(
        StructLiteralExpression { path, fields },
        span,
    );

    Ok(Spanned::new(Expression::StructLiteral(literal), span))
}
