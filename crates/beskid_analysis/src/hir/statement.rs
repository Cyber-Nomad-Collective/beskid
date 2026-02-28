use crate::syntax::Spanned;
use crate::query::{HirNode, HirNodeKind, HirNodeRef};

use super::block::HirBlock;
use super::common::HirIdentifier;
use super::expression::ExpressionNode;
use super::phase::{HirPhase, Phase};
use super::range_expression::HirRangeExpression;
use super::types::HirType;

#[derive(beskid_ast_derive::PhaseFromAst)]
#[phase(source = "crate::syntax::Statement", phase = "crate::hir::AstPhase")]
pub enum StatementNode<P: Phase> {
    #[phase(from = "Let")]
    LetStatement(Spanned<P::LetStatement>),
    #[phase(from = "Return")]
    ReturnStatement(Spanned<P::ReturnStatement>),
    #[phase(from = "Break")]
    BreakStatement(Spanned<P::BreakStatement>),
    #[phase(from = "Continue")]
    ContinueStatement(Spanned<P::ContinueStatement>),
    #[phase(from = "While")]
    WhileStatement(Spanned<P::WhileStatement>),
    #[phase(from = "For")]
    ForStatement(Spanned<P::ForStatement>),
    #[phase(from = "If")]
    IfStatement(Spanned<P::IfStatement>),
    #[phase(from = "Expression")]
    ExpressionStatement(Spanned<P::ExpressionStatement>),
}

impl HirNode for StatementNode<HirPhase> {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            StatementNode::LetStatement(stmt) => push(HirNodeRef(&stmt.node)),
            StatementNode::ReturnStatement(stmt) => push(HirNodeRef(&stmt.node)),
            StatementNode::BreakStatement(stmt) => push(HirNodeRef(&stmt.node)),
            StatementNode::ContinueStatement(stmt) => push(HirNodeRef(&stmt.node)),
            StatementNode::WhileStatement(stmt) => push(HirNodeRef(&stmt.node)),
            StatementNode::ForStatement(stmt) => push(HirNodeRef(&stmt.node)),
            StatementNode::IfStatement(stmt) => push(HirNodeRef(&stmt.node)),
            StatementNode::ExpressionStatement(stmt) => push(HirNodeRef(&stmt.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Statement
    }
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "LetStatement")]
pub struct HirLetStatement {
    #[ast(skip)]
    pub mutable: bool,
    #[ast(child)]
    pub name: Spanned<HirIdentifier>,
    #[ast(child)]
    pub type_annotation: Option<Spanned<HirType>>,
    #[ast(child)]
    pub value: Spanned<ExpressionNode<HirPhase>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ReturnStatement")]
pub struct HirReturnStatement {
    #[ast(child)]
    pub value: Option<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "BreakStatement")]
pub struct HirBreakStatement;

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ContinueStatement")]
pub struct HirContinueStatement;

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "WhileStatement")]
pub struct HirWhileStatement {
    #[ast(child)]
    pub condition: Spanned<ExpressionNode<HirPhase>>,
    #[ast(child)]
    pub body: Spanned<HirBlock>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ForStatement")]
pub struct HirForStatement {
    #[ast(child)]
    pub iterator: Spanned<HirIdentifier>,
    #[ast(child)]
    pub range: Spanned<HirRangeExpression>,
    #[ast(child)]
    pub body: Spanned<HirBlock>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "IfStatement")]
pub struct HirIfStatement {
    #[ast(child)]
    pub condition: Spanned<ExpressionNode<HirPhase>>,
    #[ast(child)]
    pub then_block: Spanned<HirBlock>,
    #[ast(child)]
    pub else_block: Option<Spanned<HirBlock>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "ExpressionStatement")]
pub struct HirExpressionStatement {
    #[ast(child)]
    pub expression: Spanned<ExpressionNode<HirPhase>>,
}
