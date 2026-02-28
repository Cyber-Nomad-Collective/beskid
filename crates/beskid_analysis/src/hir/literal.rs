#[derive(
    beskid_ast_derive::PhaseFromAst, Debug, Clone, PartialEq, Eq, beskid_ast_derive::HirNode,
)]
#[ast(kind = "Literal")]
#[phase(source = "crate::syntax::Literal", phase = "crate::hir::HirPhase")]
pub enum HirLiteral {
    Integer(String),
    Float(String),
    String(String),
    Char(String),
    Bool(bool),
}
