use crate::syntax::{
    AssignExpression, BinaryExpression, BlockExpression, CallExpression, ContractDefinition,
    EnumConstructorExpression, EnumDefinition, ExpressionStatement, ForStatement,
    FunctionDefinition, GroupedExpression, IfStatement, LetStatement, LiteralExpression,
    MatchExpression, MemberExpression, MethodDefinition, ModuleDeclaration, PathExpression,
    ReturnStatement, StructLiteralExpression, TypeDefinition, UnaryExpression, UseDeclaration,
    WhileStatement, BreakStatement, ContinueStatement,
};

use super::{
    HirAssignExpression, HirBinaryExpression, HirBlockExpression, HirCallExpression,
    HirContractDefinition, HirEnumConstructorExpression, HirEnumDefinition,
    HirExpressionStatement, HirForStatement, HirFunctionDefinition, HirGroupedExpression,
    HirIfStatement, HirLetStatement, HirLiteralExpression, HirMatchExpression,
    HirMemberExpression, HirMethodDefinition, HirModuleDeclaration, HirPathExpression,
    HirReturnStatement, HirStructLiteralExpression, HirTypeDefinition, HirUnaryExpression,
    HirUseDeclaration, HirWhileStatement, HirBreakStatement, HirContinueStatement,
};

pub trait Phase {
    type FunctionDefinition;
    type MethodDefinition;
    type TypeDefinition;
    type EnumDefinition;
    type ContractDefinition;
    type ModuleDeclaration;
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
    type ModuleDeclaration = ModuleDeclaration;
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
}

impl Phase for HirPhase {
    type FunctionDefinition = HirFunctionDefinition;
    type MethodDefinition = HirMethodDefinition;
    type TypeDefinition = HirTypeDefinition;
    type EnumDefinition = HirEnumDefinition;
    type ContractDefinition = HirContractDefinition;
    type ModuleDeclaration = HirModuleDeclaration;
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
}
