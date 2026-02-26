use crate::errors::CodegenError;
use crate::lowering::context::CodegenContext;
use crate::lowering::context::CodegenResult;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use cranelift_codegen::ir::{
    AbiParam, ExternalName, GlobalValueData, InstBuilder, Signature, Value,
};
use cranelift_codegen::isa::CallConv;
use cranelift_frontend::FunctionBuilder;
use pecan_analysis::hir::{HirLiteral, HirPrimitiveType};
use pecan_analysis::syntax::{SpanInfo, Spanned};
use pecan_analysis::types::{TypeId, TypeInfo, TypeResult};



pub(crate) fn lower_literal(
    literal: &Spanned<HirLiteral>,
    expression_span: SpanInfo,
    type_result: &TypeResult,
    codegen: &mut CodegenContext,
    builder: &mut FunctionBuilder,
) -> CodegenResult<Value> {
    let type_id = type_result
        .expr_types
        .get(&expression_span)
        .copied()
        .or_else(|| match &literal.node {
            HirLiteral::Integer(_) => find_literal_type(type_result, HirPrimitiveType::I32),
            HirLiteral::Float(_) => find_literal_type(type_result, HirPrimitiveType::F64),
            HirLiteral::Bool(_) => find_literal_type(type_result, HirPrimitiveType::Bool),
            _ => None,
        })
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
        HirLiteral::Char(value) => {
            let trimmed = value.trim_matches('"').trim_matches('\'');
            let mut chars = trimmed.chars();
            let ch = chars.next().ok_or(CodegenError::UnsupportedNode {
                span: literal.span,
                node: "empty char literal",
            })?;
            Ok(builder.ins().iconst(clif_ty, ch as i64))
        }
        HirLiteral::String(value) => {
            let trimmed = value.trim_matches('"');
            let bytes = trimmed.as_bytes();
            let len = bytes.len();
            let symbol = codegen.intern_string_literal(bytes);
            let string_gv = builder.func.create_global_value(GlobalValueData::Symbol {
                name: ExternalName::testcase(symbol),
                offset: 0.into(),
                colocated: true,
                tls: false,
            });
            let str_ptr = builder.ins().global_value(pointer_type(), string_gv);
            let len_val = builder.ins().iconst(pointer_type(), len as i64);
            let mut signature = Signature::new(CallConv::SystemV);
            signature.params.push(AbiParam::new(pointer_type()));
            signature.params.push(AbiParam::new(pointer_type()));
            signature.returns.push(AbiParam::new(pointer_type()));
            let sig_ref = builder.func.import_signature(signature);
            let func_ref = builder.func.import_function(cranelift_codegen::ir::ExtFuncData {
                name: ExternalName::testcase("str_new".to_string()),
                signature: sig_ref,
                colocated: false,
                patchable: false,
            });
            let call = builder.ins().call(func_ref, &[str_ptr, len_val]);
            let result = builder.inst_results(call).get(0).copied().ok_or(CodegenError::UnsupportedNode {
                span: literal.span,
                node: "string literal result",
            })?;
            Ok(result)
        }
        _ => Err(CodegenError::UnsupportedNode {
            span: literal.span,
            node: "literal kind",
        }),
    }
}

fn find_literal_type(type_result: &TypeResult, primitive: HirPrimitiveType) -> Option<TypeId> {
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
