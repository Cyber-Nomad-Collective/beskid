use crate::syntax::Spanned;
use crate::query::{HirNode, HirNodeKind, HirNodeRef};

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

impl HirNode for ExpressionNode<HirPhase> {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            ExpressionNode::MatchExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::AssignExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::BinaryExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::UnaryExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::CallExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::MemberExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::LiteralExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::PathExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::StructLiteralExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::EnumConstructorExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::BlockExpression(expr) => push(HirNodeRef(&expr.node)),
            ExpressionNode::GroupedExpression(expr) => push(HirNodeRef(&expr.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Expression
    }
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "MatchExpression")]
pub struct HirMatchExpression {
    #[ast(child)]
    pub scrutinee: Box<Spanned<ExpressionNode<HirPhase>>>,
    #[ast(children)]
    pub arms: Vec<Spanned<HirMatchArm>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "AssignExpression")]
pub struct HirAssignExpression {
    #[ast(child)]
    pub target: Box<Spanned<ExpressionNode<HirPhase>>>,
    #[ast(child)]
    pub value: Box<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "BinaryExpression")]
pub struct HirBinaryExpression {
    #[ast(child)]
    pub left: Box<Spanned<ExpressionNode<HirPhase>>>,
    #[ast(child)]
    pub op: Spanned<HirBinaryOp>,
    #[ast(child)]
    pub right: Box<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "BinaryOp")]
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

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "UnaryExpression")]
pub struct HirUnaryExpression {
    #[ast(child)]
    pub op: Spanned<HirUnaryOp>,
    #[ast(child)]
    pub expr: Box<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "UnaryOp")]
pub enum HirUnaryOp {
    Neg,
    Not,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "CallExpression")]
pub struct HirCallExpression {
    #[ast(child)]
    pub callee: Box<Spanned<ExpressionNode<HirPhase>>>,
    #[ast(children)]
    pub args: Vec<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "MemberExpression")]
pub struct HirMemberExpression {
    #[ast(child)]
    pub target: Box<Spanned<ExpressionNode<HirPhase>>>,
    #[ast(child)]
    pub member: Spanned<HirIdentifier>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "LiteralExpression")]
pub struct HirLiteralExpression {
    #[ast(child)]
    pub literal: Spanned<HirLiteral>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "PathExpression")]
pub struct HirPathExpression {
    #[ast(child)]
    pub path: Spanned<HirPath>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "StructLiteralExpression")]
pub struct HirStructLiteralExpression {
    #[ast(child)]
    pub path: Spanned<HirPath>,
    #[ast(children)]
    pub fields: Vec<Spanned<HirStructLiteralField>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "EnumConstructorExpression")]
pub struct HirEnumConstructorExpression {
    #[ast(child)]
    pub path: Spanned<HirEnumPath>,
    #[ast(children)]
    pub args: Vec<Spanned<ExpressionNode<HirPhase>>>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "BlockExpression")]
pub struct HirBlockExpression {
    #[ast(child)]
    pub block: Spanned<HirBlock>,
}

#[derive(beskid_ast_derive::HirNode)]
#[ast(kind = "GroupedExpression")]
pub struct HirGroupedExpression {
    #[ast(child)]
    pub expr: Box<Spanned<ExpressionNode<HirPhase>>>,
}
