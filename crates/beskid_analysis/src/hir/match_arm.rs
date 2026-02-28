use crate::syntax::Spanned;

use super::expression::ExpressionNode;
use super::pattern::HirPattern;
use super::phase::HirPhase;

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "MatchArm")]
pub struct HirMatchArm {
    #[ast(child)]
    pub pattern: Spanned<HirPattern>,
    #[ast(child)]
    pub guard: Option<Spanned<ExpressionNode<HirPhase>>>,
    #[ast(child)]
    pub value: Spanned<ExpressionNode<HirPhase>>,
}
