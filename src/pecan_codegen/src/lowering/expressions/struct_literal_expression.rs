use crate::errors::CodegenError;
use crate::lowering::descriptor::{is_pointer_like_type, struct_field_offsets};
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use crate::module_emission::descriptor_symbol_name;
use cranelift_codegen::ir::{
    AbiParam, ExternalName, GlobalValueData, InstBuilder, MemFlags, Signature, Value,
};
use cranelift_codegen::isa::CallConv;
use pecan_analysis::hir::HirStructLiteralExpression;
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::TypeInfo;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirStructLiteralExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let type_id = ctx
            .type_result
            .expr_types
            .get(&node.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType { span: node.span })?;
        let item_id = match ctx.type_result.types.get(type_id) {
            Some(TypeInfo::Named(item_id)) => *item_id,
            _ => {
                return Err(CodegenError::UnsupportedNode {
                    span: node.span,
                    node: "struct literal type",
                })
            }
        };
        let layout = ctx
            .codegen
            .type_layout(ctx.type_result, type_id)
            .ok_or(CodegenError::UnsupportedNode {
                span: node.span,
                node: "struct literal layout",
            })?;
        let offsets = struct_field_offsets(ctx.type_result, item_id).ok_or(CodegenError::UnsupportedNode {
            span: node.span,
            node: "struct literal offsets",
        })?;
        let fields = ctx
            .type_result
            .struct_fields_ordered
            .get(&item_id)
            .ok_or(CodegenError::UnsupportedNode {
                span: node.span,
                node: "struct literal fields",
            })?;
        let mut field_types = std::collections::HashMap::new();
        for (name, field_type) in fields {
            field_types.insert(name.as_str(), *field_type);
        }

        let alloc_ptr = emit_alloc(ctx, node.span, layout.size, type_id)?;

        for field in &node.node.fields {
            let name = field.node.name.node.name.as_str();
            let offset = offsets.get(name).copied().ok_or(CodegenError::UnsupportedNode {
                span: field.node.name.span,
                node: "struct literal field offset",
            })?;
            let field_type = field_types.get(name).copied().ok_or(CodegenError::UnsupportedNode {
                span: field.node.name.span,
                node: "struct literal field type",
            })?;
            let value = lower_node(&field.node.value, ctx)?.ok_or(CodegenError::UnsupportedNode {
                span: field.node.value.span,
                node: "unit-valued struct field",
            })?;
            let offset_val = ctx.builder.ins().iconst(pointer_type(), offset as i64);
            let field_addr = ctx.builder.ins().iadd(alloc_ptr, offset_val);
            if is_pointer_like_type(ctx.type_result, field_type) {
                emit_write_barrier(ctx, alloc_ptr, value)?;
            }
            let _store_ty = map_type_id_to_clif(ctx.type_result, field_type).ok_or(CodegenError::UnsupportedNode {
                span: field.node.name.span,
                node: "struct literal field clif type",
            })?;
            ctx.builder.ins().store(MemFlags::new(), value, field_addr, 0);
        }

        Ok(Some(alloc_ptr))
    }
}

fn emit_alloc(
    ctx: &mut NodeLoweringContext<'_, '_>,
    span: pecan_analysis::syntax::SpanInfo,
    size: usize,
    type_id: pecan_analysis::types::TypeId,
) -> Result<Value, CodegenError> {
    let mut signature = Signature::new(CallConv::SystemV);
    signature.params.push(AbiParam::new(pointer_type()));
    signature.params.push(AbiParam::new(pointer_type()));
    signature.returns.push(AbiParam::new(pointer_type()));
    let sig_ref = ctx.builder.func.import_signature(signature);
    let func_ref = ctx.builder.func.import_function(cranelift_codegen::ir::ExtFuncData {
        name: ExternalName::testcase("alloc".to_string()),
        signature: sig_ref,
        colocated: true,
        patchable: false,
    });
    let size_val = ctx.builder.ins().iconst(pointer_type(), size as i64);
    let desc_name = descriptor_symbol_name(type_id);
    let desc_gv = ctx.builder.func.create_global_value(GlobalValueData::Symbol {
        name: ExternalName::testcase(desc_name),
        offset: 0.into(),
        colocated: true,
        tls: false,
    });
    let desc_val = ctx.builder.ins().global_value(pointer_type(), desc_gv);
    let call = ctx.builder.ins().call(func_ref, &[size_val, desc_val]);
    let result = ctx
        .builder
        .inst_results(call)
        .get(0)
        .copied()
        .ok_or(CodegenError::UnsupportedNode { span, node: "alloc result" })?;
    Ok(result)
}

fn emit_write_barrier(
    ctx: &mut NodeLoweringContext<'_, '_>,
    dst_obj: Value,
    value_ptr: Value,
) -> Result<(), CodegenError> {
    let mut signature = Signature::new(CallConv::SystemV);
    signature.params.push(AbiParam::new(pointer_type()));
    signature.params.push(AbiParam::new(pointer_type()));
    let sig_ref = ctx.builder.func.import_signature(signature);
    let func_ref = ctx.builder.func.import_function(cranelift_codegen::ir::ExtFuncData {
        name: ExternalName::testcase("gc_write_barrier".to_string()),
        signature: sig_ref,
        colocated: true,
        patchable: false,
    });
    ctx.builder.ins().call(func_ref, &[dst_obj, value_ptr]);
    Ok(())
}
