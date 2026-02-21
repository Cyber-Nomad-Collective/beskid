use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::{Path, SpanInfo, Spanned, Visibility};
use crate::syntax::items::parse_helpers::parse_visibility_or_default;

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct ModuleDeclaration {
    #[ast(child)]
    pub visibility: Spanned<Visibility>,
    #[ast(child)]
    pub path: Spanned<Path>,
}

impl Parsable for ModuleDeclaration {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        let span = SpanInfo::from_span(&pair.as_span());
        let mut inner = pair.clone().into_inner().peekable();
        let visibility = parse_visibility_or_default(&pair, &mut inner)?;
        let path = Path::parse(
            inner
                .next()
                .ok_or(ParseError::missing(Rule::Path))?,
        )?;

        Ok(Spanned::new(Self { visibility, path }, span))
    }
}
