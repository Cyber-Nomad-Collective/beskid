use crate::syntax::Spanned;

use super::expression::ExpressionNode;
use super::phase::HirPhase;

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "RangeExpression")]
pub struct HirRangeExpression {
    #[ast(child)]
    pub start: Spanned<ExpressionNode<HirPhase>>,
    #[ast(child)]
    pub end: Spanned<ExpressionNode<HirPhase>>,
}
