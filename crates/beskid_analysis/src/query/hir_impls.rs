use crate::hir::{
    HirBlock, HirBreakStatement, HirCallExpression, HirContractDefinition, HirContractEmbedding,
    HirContractMethodSignature, HirContractNode, HirContinueStatement, HirEnumConstructorExpression,
    HirEnumDefinition, HirEnumPattern, HirEnumPath, HirEnumVariant, HirExpressionNode,
    HirExpressionStatement, HirField, HirForStatement, HirFunctionDefinition, HirGroupedExpression,
    HirIdentifier, HirIfStatement, HirInlineModule, HirItem, HirLetStatement,
    HirLiteralExpression, HirMatchArm, HirMatchExpression, HirMemberExpression, HirMethodDefinition,
    HirModule, HirModuleDeclaration, HirParameter, HirParameterModifier, HirPath, HirPathExpression,
    HirPathSegment, HirPattern, HirPrimitiveType, HirProgram, HirRangeExpression,
    HirReturnStatement, HirStatementNode, HirStructLiteralExpression, HirStructLiteralField, HirType,
    HirTypeDefinition, HirUnaryExpression, HirUseDeclaration, HirVisibility, HirWhileStatement,
};
use crate::query::{HirNode, HirNodeKind, HirNodeRef};

macro_rules! impl_hir_node_with_children {
    ($ty:ty, $kind:expr, |$this:ident, $push:ident| $children:block) => {
        impl HirNode for $ty {
            fn as_any(&self) -> &dyn std::any::Any {
                self
            }

            fn children<'a>(&'a self, $push: &mut dyn FnMut(HirNodeRef<'a>)) {
                let $this = self;
                $children
            }

            fn node_kind(&self) -> HirNodeKind {
                $kind
            }
        }
    };
}

impl HirNode for HirProgram {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        for item in &self.items {
            push(HirNodeRef(&item.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Program
    }
}

impl HirNode for HirModule {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        for item in &self.items {
            push(HirNodeRef(&item.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Module
    }
}

impl HirNode for HirItem {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            HirItem::FunctionDefinition(def) => push(HirNodeRef(&def.node)),
            HirItem::MethodDefinition(def) => push(HirNodeRef(&def.node)),
            HirItem::TypeDefinition(def) => push(HirNodeRef(&def.node)),
            HirItem::EnumDefinition(def) => push(HirNodeRef(&def.node)),
            HirItem::ContractDefinition(def) => push(HirNodeRef(&def.node)),
            HirItem::ModuleDeclaration(def) => push(HirNodeRef(&def.node)),
            HirItem::InlineModule(def) => push(HirNodeRef(&def.node)),
            HirItem::UseDeclaration(def) => push(HirNodeRef(&def.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Item
    }
}

impl HirNode for HirBlock {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        for statement in &self.statements {
            push(HirNodeRef(&statement.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Block
    }
}

impl HirNode for HirStatementNode {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            HirStatementNode::LetStatement(stmt) => push(HirNodeRef(&stmt.node)),
            HirStatementNode::ReturnStatement(stmt) => push(HirNodeRef(&stmt.node)),
            HirStatementNode::BreakStatement(stmt) => push(HirNodeRef(&stmt.node)),
            HirStatementNode::ContinueStatement(stmt) => push(HirNodeRef(&stmt.node)),
            HirStatementNode::WhileStatement(stmt) => push(HirNodeRef(&stmt.node)),
            HirStatementNode::ForStatement(stmt) => push(HirNodeRef(&stmt.node)),
            HirStatementNode::IfStatement(stmt) => push(HirNodeRef(&stmt.node)),
            HirStatementNode::ExpressionStatement(stmt) => push(HirNodeRef(&stmt.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Statement
    }
}

impl HirNode for HirExpressionNode {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            HirExpressionNode::MatchExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::AssignExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::BinaryExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::UnaryExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::CallExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::MemberExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::LiteralExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::PathExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::StructLiteralExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::EnumConstructorExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::BlockExpression(expr) => push(HirNodeRef(&expr.node)),
            HirExpressionNode::GroupedExpression(expr) => push(HirNodeRef(&expr.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Expression
    }
}

macro_rules! impl_leaf_hir_node {
    ($ty:ty, $kind:expr) => {
        impl HirNode for $ty {
            fn as_any(&self) -> &dyn std::any::Any {
                self
            }

            fn node_kind(&self) -> HirNodeKind {
                $kind
            }
        }
    };
}

impl_leaf_hir_node!(HirIdentifier, HirNodeKind::Identifier);
impl_leaf_hir_node!(HirVisibility, HirNodeKind::Visibility);
impl_leaf_hir_node!(HirPrimitiveType, HirNodeKind::PrimitiveType);
impl_leaf_hir_node!(HirParameterModifier, HirNodeKind::ParameterModifier);
impl_leaf_hir_node!(HirBreakStatement, HirNodeKind::BreakStatement);
impl_leaf_hir_node!(HirContinueStatement, HirNodeKind::ContinueStatement);

impl HirNode for HirPathSegment {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.name.node));
        for arg in &self.type_args {
            push(HirNodeRef(&arg.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::PathSegment
    }
}

impl HirNode for HirPath {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        for segment in &self.segments {
            push(HirNodeRef(&segment.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Path
    }
}

impl HirNode for HirEnumPath {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.type_name.node));
        push(HirNodeRef(&self.variant.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::EnumPath
    }
}

impl HirNode for HirType {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            HirType::Primitive(primitive) => push(HirNodeRef(&primitive.node)),
            HirType::Complex(path) => push(HirNodeRef(&path.node)),
            HirType::Array(inner) | HirType::Ref(inner) => push(HirNodeRef(&inner.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Type
    }
}

impl HirNode for HirField {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.name.node));
        push(HirNodeRef(&self.ty.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Field
    }
}

impl HirNode for HirParameter {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        if let Some(modifier) = &self.modifier {
            push(HirNodeRef(&modifier.node));
        }
        push(HirNodeRef(&self.name.node));
        push(HirNodeRef(&self.ty.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Parameter
    }
}

impl HirNode for HirStructLiteralField {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.name.node));
        push(HirNodeRef(&self.value.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::StructLiteralField
    }
}

impl HirNode for HirRangeExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.start.node));
        push(HirNodeRef(&self.end.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::RangeExpression
    }
}

impl HirNode for HirMatchArm {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.pattern.node));
        if let Some(guard) = &self.guard {
            push(HirNodeRef(&guard.node));
        }
        push(HirNodeRef(&self.value.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::MatchArm
    }
}

impl HirNode for HirPattern {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            HirPattern::Wildcard => {}
            HirPattern::Identifier(identifier) => push(HirNodeRef(&identifier.node)),
            HirPattern::Literal(literal) => push(HirNodeRef(&literal.node)),
            HirPattern::Enum(pattern) => push(HirNodeRef(&pattern.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Pattern
    }
}

impl HirNode for HirEnumPattern {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.path.node));
        for item in &self.items {
            push(HirNodeRef(&item.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::EnumPattern
    }
}

impl_hir_node_with_children!(HirFunctionDefinition, HirNodeKind::FunctionDefinition, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.name.node));
    for generic in &this.generics {
        push(HirNodeRef(&generic.node));
    }
    for parameter in &this.parameters {
        push(HirNodeRef(&parameter.node));
    }
    if let Some(return_type) = &this.return_type {
        push(HirNodeRef(&return_type.node));
    }
    push(HirNodeRef(&this.body.node));
});

impl_hir_node_with_children!(HirMethodDefinition, HirNodeKind::MethodDefinition, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.receiver_type.node));
    push(HirNodeRef(&this.name.node));
    for parameter in &this.parameters {
        push(HirNodeRef(&parameter.node));
    }
    if let Some(return_type) = &this.return_type {
        push(HirNodeRef(&return_type.node));
    }
    push(HirNodeRef(&this.body.node));
});

impl_hir_node_with_children!(HirTypeDefinition, HirNodeKind::TypeDefinition, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.name.node));
    for generic in &this.generics {
        push(HirNodeRef(&generic.node));
    }
    for field in &this.fields {
        push(HirNodeRef(&field.node));
    }
});

impl_hir_node_with_children!(HirEnumDefinition, HirNodeKind::EnumDefinition, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.name.node));
    for generic in &this.generics {
        push(HirNodeRef(&generic.node));
    }
    for variant in &this.variants {
        push(HirNodeRef(&variant.node));
    }
});

impl_hir_node_with_children!(HirEnumVariant, HirNodeKind::EnumVariant, |this, push| {
    push(HirNodeRef(&this.name.node));
    for field in &this.fields {
        push(HirNodeRef(&field.node));
    }
});

impl_hir_node_with_children!(HirContractDefinition, HirNodeKind::ContractDefinition, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.name.node));
    for item in &this.items {
        push(HirNodeRef(&item.node));
    }
});

impl HirNode for HirContractNode {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        match self {
            HirContractNode::MethodSignature(signature) => push(HirNodeRef(&signature.node)),
            HirContractNode::Embedding(embedding) => push(HirNodeRef(&embedding.node)),
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::ContractNode
    }
}

impl_hir_node_with_children!(
    HirContractMethodSignature,
    HirNodeKind::ContractMethodSignature,
    |this, push| {
        push(HirNodeRef(&this.name.node));
        for parameter in &this.parameters {
            push(HirNodeRef(&parameter.node));
        }
        if let Some(return_type) = &this.return_type {
            push(HirNodeRef(&return_type.node));
        }
    }
);

impl HirNode for HirContractEmbedding {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.name.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::ContractEmbedding
    }
}

impl_hir_node_with_children!(HirModuleDeclaration, HirNodeKind::ModuleDeclaration, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.path.node));
});

impl_hir_node_with_children!(HirInlineModule, HirNodeKind::InlineModule, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.name.node));
    for item in &this.items {
        push(HirNodeRef(&item.node));
    }
});

impl_hir_node_with_children!(HirUseDeclaration, HirNodeKind::UseDeclaration, |this, push| {
    push(HirNodeRef(&this.visibility.node));
    push(HirNodeRef(&this.path.node));
});

impl HirNode for HirLetStatement {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.name.node));
        if let Some(annotation) = &self.type_annotation {
            push(HirNodeRef(&annotation.node));
        }
        push(HirNodeRef(&self.value.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::LetStatement
    }
}

impl HirNode for HirReturnStatement {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        if let Some(value) = &self.value {
            push(HirNodeRef(&value.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::ReturnStatement
    }
}

impl HirNode for HirWhileStatement {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.condition.node));
        push(HirNodeRef(&self.body.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::WhileStatement
    }
}

impl HirNode for HirForStatement {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.iterator.node));
        push(HirNodeRef(&self.range.node));
        push(HirNodeRef(&self.body.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::ForStatement
    }
}

impl HirNode for HirIfStatement {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.condition.node));
        push(HirNodeRef(&self.then_block.node));
        if let Some(else_block) = &self.else_block {
            push(HirNodeRef(&else_block.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::IfStatement
    }
}

impl HirNode for HirExpressionStatement {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.expression.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::ExpressionStatement
    }
}

impl HirNode for HirMatchExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.scrutinee.node));
        for arm in &self.arms {
            push(HirNodeRef(&arm.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::MatchExpression
    }
}

impl HirNode for crate::hir::HirAssignExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.target.node));
        push(HirNodeRef(&self.value.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::AssignExpression
    }
}

impl HirNode for crate::hir::HirBinaryExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.left.node));
        push(HirNodeRef(&self.right.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::BinaryExpression
    }
}

impl_leaf_hir_node!(crate::hir::HirBinaryOp, HirNodeKind::BinaryOp);

impl HirNode for HirUnaryExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.op.node));
        push(HirNodeRef(&self.expr.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::UnaryExpression
    }
}

impl_leaf_hir_node!(crate::hir::HirUnaryOp, HirNodeKind::UnaryOp);

impl HirNode for HirCallExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.callee.node));
        for arg in &self.args {
            push(HirNodeRef(&arg.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::CallExpression
    }
}

impl HirNode for HirMemberExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.target.node));
        push(HirNodeRef(&self.member.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::MemberExpression
    }
}

impl HirNode for HirLiteralExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.literal.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::LiteralExpression
    }
}

impl HirNode for HirPathExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.path.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::PathExpression
    }
}

impl HirNode for HirStructLiteralExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.path.node));
        for field in &self.fields {
            push(HirNodeRef(&field.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::StructLiteralExpression
    }
}

impl HirNode for HirEnumConstructorExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.path.node));
        for arg in &self.args {
            push(HirNodeRef(&arg.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::EnumConstructorExpression
    }
}

impl HirNode for crate::hir::HirBlockExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.block.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::BlockExpression
    }
}

impl HirNode for HirGroupedExpression {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        push(HirNodeRef(&self.expr.node));
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::GroupedExpression
    }
}
