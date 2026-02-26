use crate::hir::{
    HirAssignExpression, HirBinaryExpression, HirBlockExpression, HirCallExpression,
    HirEnumConstructorExpression, HirEnumPattern, HirExpressionNode, HirGroupedExpression,
    HirLiteral, HirLiteralExpression, HirMatchArm, HirMatchExpression, HirMemberExpression,
    HirPathExpression, HirPattern, HirStructLiteralExpression, HirStructLiteralField,
    HirUnaryExpression,
};
use crate::syntax::{self, Spanned};

use super::Lowerable;

impl Lowerable for Spanned<syntax::Expression> {
    type Output = Spanned<HirExpressionNode>;

    fn lower(&self) -> Self::Output {
        let node = match &self.node {
            syntax::Expression::Match(match_expr) => {
                HirExpressionNode::MatchExpression(match_expr.lower())
            }
            syntax::Expression::Assign(assign_expr) => {
                HirExpressionNode::AssignExpression(assign_expr.lower())
            }
            syntax::Expression::Binary(binary_expr) => {
                HirExpressionNode::BinaryExpression(binary_expr.lower())
            }
            syntax::Expression::Unary(unary_expr) => {
                HirExpressionNode::UnaryExpression(unary_expr.lower())
            }
            syntax::Expression::Call(call_expr) => {
                HirExpressionNode::CallExpression(call_expr.lower())
            }
            syntax::Expression::Member(member_expr) => {
                HirExpressionNode::MemberExpression(member_expr.lower())
            }
            syntax::Expression::Literal(literal_expr) => {
                HirExpressionNode::LiteralExpression(literal_expr.lower())
            }
            syntax::Expression::Path(path_expr) => {
                HirExpressionNode::PathExpression(path_expr.lower())
            }
            syntax::Expression::StructLiteral(struct_expr) => {
                HirExpressionNode::StructLiteralExpression(struct_expr.lower())
            }
            syntax::Expression::EnumConstructor(enum_expr) => {
                HirExpressionNode::EnumConstructorExpression(enum_expr.lower())
            }
            syntax::Expression::Block(block_expr) => {
                HirExpressionNode::BlockExpression(block_expr.lower())
            }
            syntax::Expression::Grouped(grouped_expr) => {
                HirExpressionNode::GroupedExpression(grouped_expr.lower())
            }
        };
        Spanned::new(node, self.span)
    }
}

impl Lowerable for Spanned<syntax::MatchArm> {
    type Output = Spanned<HirMatchArm>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirMatchArm {
                pattern: self.node.pattern.lower(),
                guard: self.node.guard.as_ref().map(Lowerable::lower),
                value: self.node.value.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::Pattern> {
    type Output = Spanned<HirPattern>;

    fn lower(&self) -> Self::Output {
        let node = match &self.node {
            syntax::Pattern::Wildcard => HirPattern::Wildcard,
            syntax::Pattern::Identifier(identifier) => HirPattern::Identifier(identifier.lower()),
            syntax::Pattern::Literal(literal) => HirPattern::Literal(literal.lower()),
            syntax::Pattern::Enum(enum_pattern) => HirPattern::Enum(enum_pattern.lower()),
        };
        Spanned::new(node, self.span)
    }
}

impl Lowerable for Spanned<syntax::MatchExpression> {
    type Output = Spanned<HirMatchExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirMatchExpression {
                scrutinee: Box::new(self.node.scrutinee.lower()),
                arms: self.node.arms.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::AssignExpression> {
    type Output = Spanned<HirAssignExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirAssignExpression {
                target: Box::new(self.node.target.lower()),
                value: Box::new(self.node.value.lower()),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::BinaryExpression> {
    type Output = Spanned<HirBinaryExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirBinaryExpression {
                left: Box::new(self.node.left.lower()),
                op: self.node.op.lower(),
                right: Box::new(self.node.right.lower()),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::UnaryExpression> {
    type Output = Spanned<HirUnaryExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirUnaryExpression {
                op: self.node.op.lower(),
                expr: Box::new(self.node.expr.lower()),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::CallExpression> {
    type Output = Spanned<HirCallExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirCallExpression {
                callee: Box::new(self.node.callee.lower()),
                args: self.node.args.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::MemberExpression> {
    type Output = Spanned<HirMemberExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirMemberExpression {
                target: Box::new(self.node.target.lower()),
                member: self.node.member.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::LiteralExpression> {
    type Output = Spanned<HirLiteralExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirLiteralExpression {
                literal: self.node.literal.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::PathExpression> {
    type Output = Spanned<HirPathExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirPathExpression {
                path: self.node.path.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::StructLiteralExpression> {
    type Output = Spanned<HirStructLiteralExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirStructLiteralExpression {
                path: self.node.path.lower(),
                fields: self.node.fields.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::EnumConstructorExpression> {
    type Output = Spanned<HirEnumConstructorExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirEnumConstructorExpression {
                path: self.node.path.lower(),
                args: self.node.args.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::BlockExpression> {
    type Output = Spanned<HirBlockExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirBlockExpression {
                block: self.node.block.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::GroupedExpression> {
    type Output = Spanned<HirGroupedExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirGroupedExpression {
                expr: Box::new(self.node.expr.lower()),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::Literal> {
    type Output = Spanned<HirLiteral>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            match &self.node {
                syntax::Literal::Integer(value) => HirLiteral::Integer(value.clone()),
                syntax::Literal::Float(value) => HirLiteral::Float(value.clone()),
                syntax::Literal::String(value) => HirLiteral::String(value.clone()),
                syntax::Literal::Char(value) => HirLiteral::Char(value.clone()),
                syntax::Literal::Bool(value) => HirLiteral::Bool(*value),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::StructLiteralField> {
    type Output = Spanned<HirStructLiteralField>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirStructLiteralField {
                name: self.node.name.lower(),
                value: self.node.value.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::EnumPattern> {
    type Output = Spanned<HirEnumPattern>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirEnumPattern {
                path: self.node.path.lower(),
                items: self.node.items.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}
