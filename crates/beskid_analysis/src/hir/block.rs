use crate::syntax::Spanned;

use super::phase::HirPhase;
use super::statement::StatementNode;

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "Block")]
pub struct HirBlock {
    #[ast(children)]
    pub statements: Vec<Spanned<StatementNode<HirPhase>>>,
}
