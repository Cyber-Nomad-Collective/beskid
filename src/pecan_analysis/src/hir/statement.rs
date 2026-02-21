use crate::syntax::Spanned;

use super::block::HirBlock;
use super::common::HirIdentifier;
use super::expression::ExpressionNode;
use super::phase::{HirPhase, Phase};
use super::range_expression::HirRangeExpression;
use super::types::HirType;

#[derive(pecan_ast_derive::PhaseFromAst)]
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
pub struct HirLetStatement {
    pub mutable: bool,
    pub name: Spanned<HirIdentifier>,
    pub type_annotation: Option<Spanned<HirType>>,
    pub value: Spanned<ExpressionNode<HirPhase>>,
}

pub struct HirReturnStatement {
    pub value: Option<Spanned<ExpressionNode<HirPhase>>>,
}

pub struct HirBreakStatement;

pub struct HirContinueStatement;

pub struct HirWhileStatement {
    pub condition: Spanned<ExpressionNode<HirPhase>>,
    pub body: Spanned<HirBlock>,
}

pub struct HirForStatement {
    pub iterator: Spanned<HirIdentifier>,
    pub range: Spanned<HirRangeExpression>,
    pub body: Spanned<HirBlock>,
}

pub struct HirIfStatement {
    pub condition: Spanned<ExpressionNode<HirPhase>>,
    pub then_block: Spanned<HirBlock>,
    pub else_block: Option<Spanned<HirBlock>>,
}

pub struct HirExpressionStatement {
    pub expression: Spanned<ExpressionNode<HirPhase>>,
}
