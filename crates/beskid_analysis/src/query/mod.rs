#[macro_export]
macro_rules! node_kinds {
    ($enum_name:ident; $($name:ident),+ $(,)?) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
        pub enum $enum_name {
            $($name),+
        }
    };
    ($($name:ident),+ $(,)?) => {
        node_kinds!(NodeKind; $($name),+);
    }
}

node_kinds!(
    NodeKind;
    Program,
    Node,
    FunctionDefinition,
    MethodDefinition,
    TypeDefinition,
    EnumDefinition,
    EnumVariant,
    ContractDefinition,
    ContractNode,
    ContractMethodSignature,
    ContractEmbedding,
    Attribute,
    AttributeDeclaration,
    AttributeTarget,
    AttributeParameter,
    AttributeArgument,
    ModuleDeclaration,
    InlineModule,
    UseDeclaration,
    Block,
    Statement,
    LetStatement,
    ReturnStatement,
    BreakStatement,
    ContinueStatement,
    WhileStatement,
    ForStatement,
    IfStatement,
    ExpressionStatement,
    RangeExpression,
    Expression,
    AssignExpression,
    BinaryExpression,
    BinaryOp,
    UnaryExpression,
    UnaryOp,
    CallExpression,
    MemberExpression,
    LiteralExpression,
    PathExpression,
    StructLiteralExpression,
    EnumConstructorExpression,
    BlockExpression,
    GroupedExpression,
    LambdaExpression,
    LambdaParameter,
    MatchExpression,
    MatchArm,
    Pattern,
    EnumPattern,
    Literal,
    Identifier,
    Type,
    Path,
    PathSegment,
    EnumPath,
    Field,
    Parameter,
    ParameterModifier,
    PrimitiveType,
    StructLiteralField,
    Visibility,
);

node_kinds!(
    HirNodeKind;
    Program,
    Module,
    Item,
    FunctionDefinition,
    MethodDefinition,
    TypeDefinition,
    EnumDefinition,
    EnumVariant,
    ContractDefinition,
    ContractNode,
    ContractMethodSignature,
    ContractEmbedding,
    Attribute,
    AttributeDeclaration,
    AttributeTarget,
    AttributeParameter,
    AttributeArgument,
    ModuleDeclaration,
    InlineModule,
    UseDeclaration,
    Block,
    Statement,
    LetStatement,
    ReturnStatement,
    BreakStatement,
    ContinueStatement,
    WhileStatement,
    ForStatement,
    IfStatement,
    ExpressionStatement,
    RangeExpression,
    Expression,
    AssignExpression,
    BinaryExpression,
    BinaryOp,
    UnaryExpression,
    UnaryOp,
    CallExpression,
    MemberExpression,
    LiteralExpression,
    PathExpression,
    StructLiteralExpression,
    EnumConstructorExpression,
    BlockExpression,
    GroupedExpression,
    LambdaExpression,
    LambdaParameter,
    MatchExpression,
    MatchArm,
    Pattern,
    EnumPattern,
    Literal,
    Identifier,
    Type,
    Path,
    PathSegment,
    EnumPath,
    Field,
    Parameter,
    ParameterModifier,
    PrimitiveType,
    StructLiteralField,
    Visibility,
);

mod ast_node;
mod descendants;
mod dyn_node_ref;
mod hir_descendants;
mod hir_node;
mod hir_node_ref;
mod hir_query;
mod hir_visit;
mod hir_walker;
mod query;
mod traversal_core;
mod visit;
mod walker;

pub use ast_node::{AstNode, NodeRef};
pub use descendants::Descendants;
pub use dyn_node_ref::DynNodeRef;
pub use hir_descendants::HirDescendants;
pub use hir_node::HirNode;
pub use hir_node_ref::HirNodeRef;
pub use hir_query::HirQuery;
pub use hir_visit::HirVisit;
pub use hir_walker::HirWalker;
pub use query::Query;
pub use visit::Visit;
pub use walker::AstWalker;
