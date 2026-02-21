#[macro_export]
macro_rules! node_kinds {
    ($($name:ident),+ $(,)?) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
        pub enum NodeKind {
            $($name),+
        }
    };
}

node_kinds! {
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
    ModuleDeclaration,
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
    MatchExpression,
    MatchArm,
    Pattern,
    EnumPattern,
    Literal,
    Identifier,
    Type,
    Path,
    EnumPath,
    Field,
    Parameter,
    ParameterModifier,
    PrimitiveType,
    StructLiteralField,
    Visibility,
}

mod ast_node;
mod descendants;
mod dyn_node_ref;
mod query;
mod visit;
mod walker;

pub use ast_node::{AstNode, NodeRef};
pub use descendants::Descendants;
pub use dyn_node_ref::DynNodeRef;
pub use query::Query;
pub use visit::Visit;
pub use walker::AstWalker;
