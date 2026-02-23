use crate::errors::CodegenError;
use crate::lowering::context::CodegenResult;
use crate::lowering::types::map_type_id_to_clif;
use cranelift_codegen::ir::{InstBuilder, Value};
use cranelift_frontend::FunctionBuilder;
use pecan_analysis::hir::HirLiteral;
use pecan_analysis::syntax::{SpanInfo, Spanned};
use pecan_analysis::types::TypeResult;



pub(crate) fn lower_literal(
    literal: &Spanned<HirLiteral>,
    expression_span: SpanInfo,
    type_result: &TypeResult,
    builder: &mut FunctionBuilder,
) -> CodegenResult<Value> {
    let type_id = type_result
        .expr_types
        .get(&expression_span)
        .copied()
        .ok_or(CodegenError::UnsupportedNode {
            span: expression_span,
            node: "literal type",
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
