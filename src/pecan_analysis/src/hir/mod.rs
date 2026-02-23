pub mod block;
pub mod common;
pub mod expression;
pub mod item;
pub mod literal;
pub mod legality;
pub mod lowering;
pub mod match_arm;
pub mod module;
pub mod pattern;
pub mod phase;
pub mod program;
pub mod range_expression;
pub mod statement;
pub mod struct_literal_field;
pub mod types;

pub use block::HirBlock;
pub use common::{HirEnumPath, HirIdentifier, HirPath, HirVisibility};
pub use expression::{
    ExpressionNode, HirAssignExpression, HirBinaryExpression, HirBinaryOp,
    HirBlockExpression, HirCallExpression, HirEnumConstructorExpression,
    HirGroupedExpression, HirLiteralExpression, HirMatchExpression, HirMemberExpression,
    HirPathExpression, HirStructLiteralExpression, HirUnaryExpression, HirUnaryOp,
};
pub use item::{
    HirContractDefinition, HirContractEmbedding, HirContractMethodSignature,
    HirContractNode, HirEnumDefinition, HirEnumVariant, HirFunctionDefinition,
    HirMethodDefinition, HirModuleDeclaration, HirTypeDefinition, HirUseDeclaration,
    Item,
};
pub use literal::HirLiteral;
pub use legality::{validate_hir_program, HirLegalityError};
pub use lowering::lower_program;
pub use match_arm::HirMatchArm;
pub use module::Module;
pub use pattern::{HirEnumPattern, HirPattern};
pub use phase::{AstPhase, HirPhase, Phase};
pub use program::Program;
pub use range_expression::HirRangeExpression;
pub use statement::{
    HirBreakStatement, HirContinueStatement, HirExpressionStatement, HirForStatement,
    HirIfStatement, HirLetStatement, HirReturnStatement, HirWhileStatement,
    StatementNode,
};
pub use struct_literal_field::HirStructLiteralField;
pub use types::{
    HirField, HirParameter, HirParameterModifier, HirPrimitiveType, HirType,
};

pub type AstProgram = Program<AstPhase>;
pub type AstModule = Module<AstPhase>;
pub type HirProgram = Program<HirPhase>;
pub type HirModule = Module<HirPhase>;

pub type AstItem = Item<AstPhase>;
pub type AstStatement = StatementNode<AstPhase>;
pub type AstExpression = ExpressionNode<AstPhase>;
pub type HirItem = Item<HirPhase>;
pub type HirStatementNode = StatementNode<HirPhase>;
pub type HirExpressionNode = ExpressionNode<HirPhase>;
