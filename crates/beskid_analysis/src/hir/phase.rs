use crate::syntax::{
    AssignExpression, AttributeDeclaration, BinaryExpression, BlockExpression, BreakStatement,
    CallExpression, ContinueStatement, ContractDefinition, EnumConstructorExpression,
    EnumDefinition, ExpressionStatement, ForStatement, FunctionDefinition, GroupedExpression,
    IfStatement, InlineModule, LambdaExpression, LetStatement, LiteralExpression, MatchExpression,
    MemberExpression, MethodDefinition, ModuleDeclaration, PathExpression, ReturnStatement,
    StructLiteralExpression, TypeDefinition, UnaryExpression, UseDeclaration, WhileStatement,
};

use super::{
    HirAssignExpression, HirBinaryExpression, HirBlockExpression, HirBreakStatement,
    HirCallExpression, HirContinueStatement, HirContractDefinition, HirEnumConstructorExpression,
    HirEnumDefinition, HirExpressionStatement, HirForStatement, HirFunctionDefinition,
    HirGroupedExpression, HirIfStatement, HirInlineModule, HirLambdaExpression, HirLetStatement,
    HirLiteralExpression, HirMatchExpression, HirMemberExpression, HirMethodDefinition,
    HirModuleDeclaration, HirPathExpression, HirReturnStatement, HirStructLiteralExpression,
    HirTypeDefinition, HirUnaryExpression, HirUseDeclaration, HirWhileStatement,
    item::HirAttributeDeclaration,
};

pub trait Phase {
    type FunctionDefinition;
    type MethodDefinition;
    type TypeDefinition;
    type EnumDefinition;
    type ContractDefinition;
    type AttributeDeclaration;
    type ModuleDeclaration;
    type InlineModule;
    type UseDeclaration;

    type LetStatement;
    type ReturnStatement;
    type BreakStatement;
    type ContinueStatement;
    type WhileStatement;
    type ForStatement;
    type IfStatement;
    type ExpressionStatement;

    type MatchExpression;
    type AssignExpression;
    type BinaryExpression;
    type UnaryExpression;
    type CallExpression;
    type MemberExpression;
    type LiteralExpression;
    type PathExpression;
    type StructLiteralExpression;
    type EnumConstructorExpression;
    type BlockExpression;
    type GroupedExpression;
    type LambdaExpression;
}

#[derive(Debug, Clone, Copy, Default)]
pub struct AstPhase;

#[derive(Debug, Clone, Copy, Default)]
pub struct HirPhase;

impl Phase for AstPhase {
    type FunctionDefinition = FunctionDefinition;
    type MethodDefinition = MethodDefinition;
    type TypeDefinition = TypeDefinition;
    type EnumDefinition = EnumDefinition;
    type ContractDefinition = ContractDefinition;
    type AttributeDeclaration = AttributeDeclaration;
    type ModuleDeclaration = ModuleDeclaration;
    type InlineModule = InlineModule;
    type UseDeclaration = UseDeclaration;

    type LetStatement = LetStatement;
    type ReturnStatement = ReturnStatement;
    type BreakStatement = BreakStatement;
    type ContinueStatement = ContinueStatement;
    type WhileStatement = WhileStatement;
    type ForStatement = ForStatement;
    type IfStatement = IfStatement;
    type ExpressionStatement = ExpressionStatement;

    type MatchExpression = MatchExpression;
    type AssignExpression = AssignExpression;
    type BinaryExpression = BinaryExpression;
    type UnaryExpression = UnaryExpression;
    type CallExpression = CallExpression;
    type MemberExpression = MemberExpression;
    type LiteralExpression = LiteralExpression;
    type PathExpression = PathExpression;
    type StructLiteralExpression = StructLiteralExpression;
    type EnumConstructorExpression = EnumConstructorExpression;
    type BlockExpression = BlockExpression;
    type GroupedExpression = GroupedExpression;
    type LambdaExpression = LambdaExpression;
}

impl Phase for HirPhase {
    type FunctionDefinition = HirFunctionDefinition;
    type MethodDefinition = HirMethodDefinition;
    type TypeDefinition = HirTypeDefinition;
    type EnumDefinition = HirEnumDefinition;
    type ContractDefinition = HirContractDefinition;
    type AttributeDeclaration = HirAttributeDeclaration;
    type ModuleDeclaration = HirModuleDeclaration;
    type InlineModule = HirInlineModule;
    type UseDeclaration = HirUseDeclaration;

    type LetStatement = HirLetStatement;
    type ReturnStatement = HirReturnStatement;
    type BreakStatement = HirBreakStatement;
    type ContinueStatement = HirContinueStatement;
    type WhileStatement = HirWhileStatement;
    type ForStatement = HirForStatement;
    type IfStatement = HirIfStatement;
    type ExpressionStatement = HirExpressionStatement;

    type MatchExpression = HirMatchExpression;
    type AssignExpression = HirAssignExpression;
    type BinaryExpression = HirBinaryExpression;
    type UnaryExpression = HirUnaryExpression;
    type CallExpression = HirCallExpression;
    type MemberExpression = HirMemberExpression;
    type LiteralExpression = HirLiteralExpression;
    type PathExpression = HirPathExpression;
    type StructLiteralExpression = HirStructLiteralExpression;
    type EnumConstructorExpression = HirEnumConstructorExpression;
    type BlockExpression = HirBlockExpression;
    type GroupedExpression = HirGroupedExpression;
    type LambdaExpression = HirLambdaExpression;
}
