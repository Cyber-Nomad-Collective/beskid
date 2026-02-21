use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Expression, Path, SpanInfo, Spanned};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct PathExpression {
    #[ast(child)]
    pub path: Spanned<Path>,
}

pub(crate) fn parse_path_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());
    let path = Path::parse(pair)?;
    let path_expr = Spanned::new(PathExpression { path }, span);

    Ok(Spanned::new(Expression::Path(path_expr), span))
}
