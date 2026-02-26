use crate::hir::{
    HirBinaryOp, HirEnumPath, HirField, HirIdentifier, HirParameter, HirParameterModifier,
    HirPath, HirPathSegment, HirPrimitiveType, HirRangeExpression, HirType, HirUnaryOp,
    HirVisibility,
};
use crate::syntax::{self, Spanned};

use super::Lowerable;

impl Lowerable for Spanned<syntax::Type> {
    type Output = Spanned<HirType>;

    fn lower(&self) -> Self::Output {
        let node = match &self.node {
            syntax::Type::Primitive(primitive) => HirType::Primitive(primitive.lower()),
            syntax::Type::Complex(path) => HirType::Complex(path.lower()),
            syntax::Type::Array(inner) => HirType::Array(Box::new(inner.lower())),
            syntax::Type::Ref(inner) => HirType::Ref(Box::new(inner.lower())),
        };
        Spanned::new(node, self.span)
    }
}

impl Lowerable for Spanned<syntax::Field> {
    type Output = Spanned<HirField>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirField {
                name: self.node.name.lower(),
                ty: self.node.ty.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::Parameter> {
    type Output = Spanned<HirParameter>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirParameter {
                modifier: self.node.modifier.as_ref().map(Lowerable::lower),
                name: self.node.name.lower(),
                ty: self.node.ty.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ParameterModifier> {
    type Output = Spanned<HirParameterModifier>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            match self.node {
                syntax::ParameterModifier::Ref => HirParameterModifier::Ref,
                syntax::ParameterModifier::Out => HirParameterModifier::Out,
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::RangeExpression> {
    type Output = Spanned<HirRangeExpression>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirRangeExpression {
                start: self.node.start.lower(),
                end: self.node.end.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::Visibility> {
    type Output = Spanned<HirVisibility>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            match self.node {
                syntax::Visibility::Public => HirVisibility::Public,
                syntax::Visibility::Private => HirVisibility::Private,
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::Identifier> {
    type Output = Spanned<HirIdentifier>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirIdentifier {
                name: self.node.name.clone(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::Path> {
    type Output = Spanned<HirPath>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirPath {
                segments: self.node.segments.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::PathSegment> {
    type Output = Spanned<HirPathSegment>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirPathSegment {
                name: self.node.name.lower(),
                type_args: self.node.type_args.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::EnumPath> {
    type Output = Spanned<HirEnumPath>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirEnumPath {
                type_name: self.node.type_name.lower(),
                variant: self.node.variant.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::PrimitiveType> {
    type Output = Spanned<HirPrimitiveType>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            match self.node {
                syntax::PrimitiveType::Bool => HirPrimitiveType::Bool,
                syntax::PrimitiveType::I32 => HirPrimitiveType::I32,
                syntax::PrimitiveType::I64 => HirPrimitiveType::I64,
                syntax::PrimitiveType::U8 => HirPrimitiveType::U8,
                syntax::PrimitiveType::F64 => HirPrimitiveType::F64,
                syntax::PrimitiveType::Char => HirPrimitiveType::Char,
                syntax::PrimitiveType::String => HirPrimitiveType::String,
                syntax::PrimitiveType::Unit => HirPrimitiveType::Unit,
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::BinaryOp> {
    type Output = Spanned<HirBinaryOp>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            match self.node {
                syntax::BinaryOp::Or => HirBinaryOp::Or,
                syntax::BinaryOp::And => HirBinaryOp::And,
                syntax::BinaryOp::Eq => HirBinaryOp::Eq,
                syntax::BinaryOp::NotEq => HirBinaryOp::NotEq,
                syntax::BinaryOp::Lt => HirBinaryOp::Lt,
                syntax::BinaryOp::Lte => HirBinaryOp::Lte,
                syntax::BinaryOp::Gt => HirBinaryOp::Gt,
                syntax::BinaryOp::Gte => HirBinaryOp::Gte,
                syntax::BinaryOp::Add => HirBinaryOp::Add,
                syntax::BinaryOp::Sub => HirBinaryOp::Sub,
                syntax::BinaryOp::Mul => HirBinaryOp::Mul,
                syntax::BinaryOp::Div => HirBinaryOp::Div,
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::UnaryOp> {
    type Output = Spanned<HirUnaryOp>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            match self.node {
                syntax::UnaryOp::Neg => HirUnaryOp::Neg,
                syntax::UnaryOp::Not => HirUnaryOp::Not,
            },
            self.span,
        )
    }
}
