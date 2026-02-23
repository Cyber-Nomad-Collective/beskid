use crate::errors::CodegenError;
use cranelift_codegen::ir::types;
use cranelift_codegen::ir::{AbiParam, Function, InstBuilder, Signature, Value};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_codegen::verify_function;
use cranelift_frontend::{FunctionBuilder, FunctionBuilderContext, Variable};
use pecan_analysis::hir::{
    HirExpressionNode, HirFunctionDefinition, HirLiteral, HirPrimitiveType, HirProgram,
    HirStatementNode, HirType,
};
use pecan_analysis::resolve::{LocalId, Resolution, ResolvedValue};
use pecan_analysis::syntax::{SpanInfo, Spanned};
use pecan_analysis::types::{TypeId, TypeInfo, TypeResult};
use std::collections::{HashMap, HashSet};

pub type CodegenResult<T> = Result<T, CodegenError>;

pub trait Lowerable: Sized {
    type Output;

    fn lower(node: &Spanned<Self>, ctx: &mut CodegenContext) -> CodegenResult<Self::Output>;
}

fn map_hir_type_to_type_id(type_result: &TypeResult, ty: &HirType) -> Option<TypeId> {
    match ty {
        HirType::Primitive(primitive) => find_primitive_type_id(type_result, primitive.node),
        _ => None,
    }
}

fn find_primitive_type_id(type_result: &TypeResult, primitive: HirPrimitiveType) -> Option<TypeId> {
    let mut index = 0usize;
    loop {
        let type_id = TypeId(index);
        let Some(info) = type_result.types.get(type_id) else {
            return None;
        };
        if matches!(info, TypeInfo::Primitive(found) if *found == primitive) {
            return Some(type_id);
        }
        index += 1;
    }
}

fn ensure_type_compatibility(
    span: SpanInfo,
    expected: TypeId,
    actual: TypeId,
    type_result: &TypeResult,
) -> CodegenResult<()> {
    if expected == actual {
        return Ok(());
    }

    let expected_info = type_result.types.get(expected);
    let actual_info = type_result.types.get(actual);
    if is_numeric_type(expected_info) && is_numeric_type(actual_info) {
        let has_intent = type_result
            .cast_intents_for_span(span)
            .any(|intent| intent.from == actual && intent.to == expected);
        if has_intent {
            return Ok(());
        }
        return Err(CodegenError::MissingCastIntent {
            span,
            expected,
            actual,
        });
    }

    Err(CodegenError::TypeMismatch {
        span,
        expected,
        actual,
    })
}

pub fn lower_node<T: Lowerable>(
    node: &Spanned<T>,
    ctx: &mut CodegenContext,
) -> CodegenResult<T::Output> {
    T::lower(node, ctx)
}

#[derive(Debug, Clone)]
pub struct LoweredFunction {
    pub name: String,
    pub clif: String,
}

#[derive(Debug, Clone, Default)]
pub struct CodegenArtifact {
    pub functions: Vec<LoweredFunction>,
}

#[derive(Debug, Default)]
pub struct CodegenContext {
    pub functions_emitted: usize,
    pub lowered_functions: Vec<LoweredFunction>,
}

impl CodegenContext {
    pub fn new() -> Self {
        Self::default()
    }
}

pub fn lower_program(
    program: &Spanned<HirProgram>,
    resolution: &Resolution,
    type_result: &TypeResult,
) -> Result<CodegenArtifact, Vec<CodegenError>> {
    let mut errors = validate_cast_intents(type_result);
    let mut ctx = CodegenContext::new();

    for item in &program.node.items {
        if let pecan_analysis::hir::HirItem::FunctionDefinition(def) = &item.node {
            if let Err(error) = lower_function(def, resolution, type_result, &mut ctx) {
                errors.push(error);
            }
        }
    }

    if errors.is_empty() {
        Ok(CodegenArtifact {
            functions: ctx.lowered_functions,
        })
    } else {
        Err(errors)
    }
}

fn validate_cast_intents(type_result: &TypeResult) -> Vec<CodegenError> {
    let mut errors = Vec::new();
    let mut seen = HashSet::new();
    let mut reverse_seen = HashSet::new();

    for intent in &type_result.cast_intents {
        let from_info = type_result.types.get(intent.from);
        let to_info = type_result.types.get(intent.to);

        if !is_numeric_type(from_info) || !is_numeric_type(to_info) {
            errors.push(CodegenError::InvalidCastIntent {
                span: intent.span,
                message: "cast intents must be numeric-to-numeric".to_string(),
            });
        }

        let key = (intent.span.start, intent.span.end, intent.from.0, intent.to.0);
        let reverse_key = (intent.span.start, intent.span.end, intent.to.0, intent.from.0);
        if !seen.insert(key) {
            errors.push(CodegenError::InvalidCastIntent {
                span: intent.span,
                message: "duplicate cast intent for span".to_string(),
            });
        }
        if reverse_seen.contains(&key) || seen.contains(&reverse_key) {
            errors.push(CodegenError::InvalidCastIntent {
                span: intent.span,
                message: "conflicting reverse cast intents for same span".to_string(),
            });
        }
        reverse_seen.insert(reverse_key);
    }

    errors
}

fn is_numeric_type(info: Option<&TypeInfo>) -> bool {
    matches!(
        info,
        Some(TypeInfo::Primitive(
            HirPrimitiveType::I32 | HirPrimitiveType::I64 | HirPrimitiveType::U8 | HirPrimitiveType::F64
        ))
    )
}

fn lower_function(
    def: &Spanned<HirFunctionDefinition>,
    resolution: &Resolution,
    type_result: &TypeResult,
    ctx: &mut CodegenContext,
) -> CodegenResult<()> {
    if !def.node.parameters.is_empty() {
        return Err(CodegenError::UnsupportedNode {
            span: def.span,
            node: "function parameters",
        });
    }

    let mut signature = Signature::new(CallConv::SystemV);
    if let Some(return_type) = &def.node.return_type {
        if let Some(clif_ty) = map_hir_type_to_clif(&return_type.node) {
            signature.returns.push(AbiParam::new(clif_ty));
        }
    }
    let expects_return = signature_has_return(&signature);
    let expected_return_type = def
        .node
        .return_type
        .as_ref()
        .and_then(|ty| map_hir_type_to_type_id(type_result, &ty.node));

    let mut function = Function::new();
    function.signature = signature;

    let mut fb_ctx = FunctionBuilderContext::new();
    let mut builder = FunctionBuilder::new(&mut function, &mut fb_ctx);
    let entry = builder.create_block();
    builder.switch_to_block(entry);
    builder.seal_block(entry);

    let mut state = FunctionLoweringState::default();
    for statement in &def.node.body.node.statements {
        lower_statement(
            statement,
            resolution,
            type_result,
            expected_return_type,
            &mut builder,
            &mut state,
        )?;
        if state.return_emitted {
            break;
        }
    }

    if !state.return_emitted {
        if expects_return {
            return Err(CodegenError::UnsupportedNode {
                span: def.span,
                node: "implicit non-unit return",
            });
        }
        builder.ins().return_(&[]);
    }

    builder.finalize();

    let flags = settings::Flags::new(settings::builder());
    if let Err(err) = verify_function(&function, &flags) {
        return Err(CodegenError::VerificationFailed {
            function: def.node.name.node.name.clone(),
            message: err.to_string(),
        });
    }

    ctx.functions_emitted += 1;
    ctx.lowered_functions.push(LoweredFunction {
        name: def.node.name.node.name.clone(),
        clif: function.to_string(),
    });

    Ok(())
}

#[derive(Default)]
struct FunctionLoweringState {
    locals: HashMap<LocalId, Variable>,
    return_emitted: bool,
}

fn lower_statement(
    statement: &Spanned<HirStatementNode>,
    resolution: &Resolution,
    type_result: &TypeResult,
    expected_return_type: Option<TypeId>,
    builder: &mut FunctionBuilder,
    state: &mut FunctionLoweringState,
) -> CodegenResult<()> {
    match &statement.node {
        HirStatementNode::LetStatement(let_stmt) => {
            let local_id = resolution
                .tables
                .locals
                .iter()
                .find(|info| info.span == let_stmt.node.name.span)
                .map(|info| info.id)
                .ok_or(CodegenError::InvalidLocalBinding {
                    span: let_stmt.node.name.span,
                })?;

            let type_id = type_result
                .local_types
                .get(&local_id)
                .copied()
                .ok_or(CodegenError::MissingLocalType {
                    span: let_stmt.node.name.span,
                })?;
            let clif_ty = map_type_id_to_clif(type_result, type_id).ok_or(
                CodegenError::UnsupportedNode {
                    span: let_stmt.node.name.span,
                    node: "unsupported local type",
                },
            )?;

            let value = lower_expression(&let_stmt.node.value, resolution, type_result, builder, state)?
                .ok_or(CodegenError::UnsupportedNode {
                    span: let_stmt.node.value.span,
                    node: "unit-valued let initializer",
                })?;

            let actual_type = type_result
                .expr_types
                .get(&let_stmt.node.value.span)
                .copied()
                .ok_or(CodegenError::MissingExpressionType {
                    span: let_stmt.node.value.span,
                })?;
            ensure_type_compatibility(
                let_stmt.node.value.span,
                type_id,
                actual_type,
                type_result,
            )?;

            let var = builder.declare_var(clif_ty);
            builder.def_var(var, value);
            state.locals.insert(local_id, var);
            Ok(())
        }
        HirStatementNode::ReturnStatement(return_stmt) => {
            match &return_stmt.node.value {
                Some(value_expr) => {
                    let value = lower_expression(value_expr, resolution, type_result, builder, state)?
                        .ok_or(CodegenError::UnsupportedNode {
                            span: value_expr.span,
                            node: "unit return value",
                        })?;
                    if let Some(expected) = expected_return_type {
                        let actual = type_result
                            .expr_types
                            .get(&value_expr.span)
                            .copied()
                            .ok_or(CodegenError::MissingExpressionType {
                                span: value_expr.span,
                            })?;
                        ensure_type_compatibility(value_expr.span, expected, actual, type_result)?;
                    }
                    builder.ins().return_(&[value]);
                }
                None => {
                    builder.ins().return_(&[]);
                }
            }
            state.return_emitted = true;
            Ok(())
        }
        HirStatementNode::ExpressionStatement(expr_stmt) => {
            let _ = lower_expression(&expr_stmt.node.expression, resolution, type_result, builder, state)?;
            Ok(())
        }
        _ => Err(CodegenError::UnsupportedNode {
            span: statement.span,
            node: "statement kind",
        }),
    }
}

fn lower_expression(
    expression: &Spanned<HirExpressionNode>,
    resolution: &Resolution,
    type_result: &TypeResult,
    builder: &mut FunctionBuilder,
    state: &mut FunctionLoweringState,
) -> CodegenResult<Option<Value>> {
    match &expression.node {
        HirExpressionNode::LiteralExpression(literal_expr) => {
            lower_literal(&literal_expr.node.literal, expression.span, type_result, builder).map(Some)
        }
        HirExpressionNode::PathExpression(path_expr) => {
            if path_expr.node.path.node.segments.len() != 1 {
                return Err(CodegenError::UnsupportedNode {
                    span: expression.span,
                    node: "multi-segment path expression",
                });
            }
            let resolved = resolution
                .tables
                .resolved_values
                .get(&path_expr.node.path.span)
                .ok_or(CodegenError::MissingResolvedValue {
                    span: path_expr.node.path.span,
                })?;
            match resolved {
                ResolvedValue::Local(local_id) => {
                    let var = state.locals.get(local_id).copied().ok_or(
                        CodegenError::InvalidLocalBinding {
                            span: path_expr.node.path.span,
                        },
                    )?;
                    Ok(Some(builder.use_var(var)))
                }
                ResolvedValue::Item(_) => Err(CodegenError::UnsupportedNode {
                    span: path_expr.node.path.span,
                    node: "item-valued path expression",
                }),
            }
        }
        HirExpressionNode::GroupedExpression(grouped) => {
            lower_expression(&grouped.node.expr, resolution, type_result, builder, state)
        }
        HirExpressionNode::BlockExpression(_) => Ok(None),
        _ => Err(CodegenError::UnsupportedNode {
            span: expression.span,
            node: "expression kind",
        }),
    }
}

fn lower_literal(
    literal: &Spanned<HirLiteral>,
    expression_span: SpanInfo,
    type_result: &TypeResult,
    builder: &mut FunctionBuilder,
) -> CodegenResult<Value> {
    let type_id = type_result
        .expr_types
        .get(&expression_span)
        .copied()
        .ok_or(CodegenError::MissingExpressionType {
            span: expression_span,
        })?;
    let clif_ty = map_type_id_to_clif(type_result, type_id).ok_or(CodegenError::UnsupportedNode {
        span: expression_span,
        node: "literal type",
    })?;

    match &literal.node {
        HirLiteral::Integer(value) => {
            let parsed = value.parse::<i64>().map_err(|_| CodegenError::UnsupportedNode {
                span: literal.span,
                node: "non-integer literal for kickoff",
            })?;
            Ok(builder.ins().iconst(clif_ty, parsed))
        }
        HirLiteral::Bool(value) => {
            let numeric = if *value { 1 } else { 0 };
            Ok(builder.ins().iconst(clif_ty, numeric))
        }
        _ => Err(CodegenError::UnsupportedNode {
            span: literal.span,
            node: "literal kind",
        }),
    }
}

fn map_hir_type_to_clif(ty: &HirType) -> Option<cranelift_codegen::ir::Type> {
    match ty {
        HirType::Primitive(primitive) => map_primitive_to_clif(primitive.node),
        _ => None,
    }
}

fn map_type_id_to_clif(type_result: &TypeResult, type_id: TypeId) -> Option<cranelift_codegen::ir::Type> {
    match type_result.types.get(type_id) {
        Some(TypeInfo::Primitive(primitive)) => map_primitive_to_clif(*primitive),
        _ => None,
    }
}

fn map_primitive_to_clif(primitive: HirPrimitiveType) -> Option<cranelift_codegen::ir::Type> {
    match primitive {
        HirPrimitiveType::Bool => Some(types::I8),
        HirPrimitiveType::I32 => Some(types::I32),
        HirPrimitiveType::I64 => Some(types::I64),
        HirPrimitiveType::U8 => Some(types::I8),
        HirPrimitiveType::F64 => Some(types::F64),
        HirPrimitiveType::Unit => None,
        HirPrimitiveType::Char | HirPrimitiveType::String => None,
    }
}

fn signature_has_return(signature: &Signature) -> bool {
    !signature.returns.is_empty()
}

#[cfg(test)]
mod tests {
    use super::lower_program;
    use crate::errors::CodegenError;
    use pecan_analysis::hir::{lower_program as lower_hir_program, AstProgram, HirProgram};
    use pecan_analysis::parsing::parsable::Parsable;
    use pecan_analysis::resolve::Resolver;
    use pecan_analysis::syntax::{Program, Spanned};
    use pecan_analysis::types::type_program;
    use pecan_analysis::{PecanParser, Rule};
    use pest::Parser;

    fn parse_program_ast(input: &str) -> Spanned<Program> {
        let mut pairs = PecanParser::parse(Rule::Program, input)
            .unwrap_or_else(|error| panic!("expected parse success: {input}\n{error}"));
        let pair = pairs.next().expect("expected parse pair");
        Program::parse(pair).expect("expected AST program")
    }

    fn lower_resolve_type(source: &str) -> (
        Spanned<HirProgram>,
        pecan_analysis::resolve::Resolution,
        pecan_analysis::types::TypeResult,
    ) {
        let program = parse_program_ast(source);
        let ast: Spanned<AstProgram> = program.into();
        let hir = lower_hir_program(&ast);
        let resolution = Resolver::new()
            .resolve_program(&hir)
            .unwrap_or_else(|errors| panic!("expected resolution success: {errors:?}"));
        let typed = type_program(&hir, &resolution)
            .unwrap_or_else(|errors| panic!("expected type success: {errors:?}"));
        (hir, resolution, typed)
    }

    #[test]
    fn codegen_lowers_basic_function_to_clif() {
        let (hir, resolution, typed) = lower_resolve_type("i64 main() { let x: i64 = 1; return x; }");
        let artifact = lower_program(&hir, &resolution, &typed)
            .expect("expected kickoff codegen lowering to succeed");
        assert_eq!(artifact.functions.len(), 1);
        assert!(artifact.functions[0].clif.contains("iconst"));
        assert!(artifact.functions[0].clif.contains("return"));
    }

    #[test]
    fn codegen_rejects_unsupported_expression_nodes_with_span() {
        let (hir, resolution, typed) = lower_resolve_type("i64 main() { return 1 + 2; }");
        let errors = lower_program(&hir, &resolution, &typed)
            .expect_err("expected unsupported binary node to fail kickoff codegen");
        assert!(
            errors
                .iter()
                .any(|error| matches!(error, CodegenError::UnsupportedNode { .. })),
            "expected UnsupportedNode error, got: {errors:?}"
        );
    }

    #[test]
    fn codegen_requires_cast_intent_for_numeric_mismatch() {
        let (hir, resolution, mut typed) =
            lower_resolve_type("i32 main() { let x: i64 = 1; return x; }");
        typed.cast_intents.clear();
        let errors = lower_program(&hir, &resolution, &typed)
            .expect_err("expected missing cast intent to fail codegen");
        assert!(
            errors
                .iter()
                .any(|error| matches!(error, CodegenError::MissingCastIntent { .. })),
            "expected MissingCastIntent error, got: {errors:?}"
        );
    }
}
