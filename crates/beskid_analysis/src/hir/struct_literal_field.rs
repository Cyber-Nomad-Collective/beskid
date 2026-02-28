use crate::syntax::Spanned;

use super::common::HirIdentifier;
use super::expression::ExpressionNode;
use super::phase::HirPhase;

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "StructLiteralField")]
pub struct HirStructLiteralField {
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(child)]
    pub value: Spanned<ExpressionNode<HirPhase>>,
}
