use crate::syntax::Spanned;

use super::common::{HirEnumPath, HirIdentifier};
use super::literal::HirLiteral;

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "Pattern")]
pub enum HirPattern {
    Wildcard,
    #[ast(child)]
    Identifier(Spanned<HirIdentifier>),
    #[ast(child)]
    Literal(Spanned<HirLiteral>),
    #[ast(child)]
    Enum(Spanned<HirEnumPattern>),
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "EnumPattern")]
pub struct HirEnumPattern {
    #[ast(child)]
    pub path: Spanned<HirEnumPath>,
    #[ast(children)]
    pub items: Vec<Spanned<HirPattern>>,
}
