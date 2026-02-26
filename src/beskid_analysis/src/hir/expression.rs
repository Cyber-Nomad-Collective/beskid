use crate::syntax::Spanned;

use super::block::HirBlock;
use super::common::{HirEnumPath, HirIdentifier, HirPath};
use super::literal::HirLiteral;
use super::match_arm::HirMatchArm;
use super::phase::{HirPhase, Phase};
use super::struct_literal_field::HirStructLiteralField;

#[derive(beskid_ast_derive::PhaseFromAst)]
#[phase(source = "crate::syntax::Expression", phase = "crate::hir::AstPhase")]
pub enum ExpressionNode<P: Phase> {
    #[phase(from = "Match")]
    MatchExpression(Spanned<P::MatchExpression>),
    #[phase(from = "Assign")]
    AssignExpression(Spanned<P::AssignExpression>),
    #[phase(from = "Binary")]
    BinaryExpression(Spanned<P::BinaryExpression>),
    #[phase(from = "Unary")]
    UnaryExpression(Spanned<P::UnaryExpression>),
    #[phase(from = "Call")]
    CallExpression(Spanned<P::CallExpression>),
    #[phase(from = "Member")]
    MemberExpression(Spanned<P::MemberExpression>),
    #[phase(from = "Literal")]
    LiteralExpression(Spanned<P::LiteralExpression>),
    #[phase(from = "Path")]
    PathExpression(Spanned<P::PathExpression>),
    #[phase(from = "StructLiteral")]
    StructLiteralExpression(Spanned<P::StructLiteralExpression>),
    #[phase(from = "EnumConstructor")]
    EnumConstructorExpression(Spanned<P::EnumConstructorExpression>),
    #[phase(from = "Block")]
    BlockExpression(Spanned<P::BlockExpression>),
    #[phase(from = "Grouped")]
    GroupedExpression(Spanned<P::GroupedExpression>),
}

pub struct HirMatchExpression {
    pub scrutinee: Box<Spanned<ExpressionNode<HirPhase>>>,
    pub arms: Vec<Spanned<HirMatchArm>>,
}

pub struct HirAssignExpression {
    pub target: Box<Spanned<ExpressionNode<HirPhase>>>,
    pub value: Box<Spanned<ExpressionNode<HirPhase>>>,
}

pub struct HirBinaryExpression {
    pub left: Box<Spanned<ExpressionNode<HirPhase>>>,
    pub op: Spanned<HirBinaryOp>,
    pub right: Box<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HirBinaryOp {
    Or,
    And,
    Eq,
    NotEq,
    Lt,
    Lte,
    Gt,
    Gte,
    Add,
    Sub,
    Mul,
    Div,
}

pub struct HirUnaryExpression {
    pub op: Spanned<HirUnaryOp>,
    pub expr: Box<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HirUnaryOp {
    Neg,
    Not,
}

pub struct HirCallExpression {
    pub callee: Box<Spanned<ExpressionNode<HirPhase>>>,
    pub args: Vec<Spanned<ExpressionNode<HirPhase>>>,
}

pub struct HirMemberExpression {
    pub target: Box<Spanned<ExpressionNode<HirPhase>>>,
    pub member: Spanned<HirIdentifier>,
}

pub struct HirLiteralExpression {
    pub literal: Spanned<HirLiteral>,
}

pub struct HirPathExpression {
    pub path: Spanned<HirPath>,
}

pub struct HirStructLiteralExpression {
    pub path: Spanned<HirPath>,
    pub fields: Vec<Spanned<HirStructLiteralField>>,
}

pub struct HirEnumConstructorExpression {
    pub path: Spanned<HirEnumPath>,
    pub args: Vec<Spanned<ExpressionNode<HirPhase>>>,
}

pub struct HirBlockExpression {
    pub block: Spanned<HirBlock>,
}

pub struct HirGroupedExpression {
    pub expr: Box<Spanned<ExpressionNode<HirPhase>>>,
}
