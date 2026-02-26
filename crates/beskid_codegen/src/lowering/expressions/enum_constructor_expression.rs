use crate::errors::CodegenError;
use crate::lowering::descriptor::{
    enum_payload_start, enum_variant_field_offsets, is_pointer_like_type,
};
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use crate::module_emission::descriptor_symbol_name;
use beskid_analysis::hir::HirEnumConstructorExpression;
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::TypeInfo;
use cranelift_codegen::ir::{
    AbiParam, ExternalName, GlobalValueData, InstBuilder, MemFlags, Signature, Value,
};
use cranelift_codegen::isa::CallConv;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirEnumConstructorExpression {
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
                    node: "enum constructor type",
                });
            }
        };
        let layout = ctx.codegen.type_layout(ctx.type_result, type_id).ok_or(
            CodegenError::UnsupportedNode {
                span: node.span,
                node: "enum constructor layout",
            },
        )?;
        let variant_name = node.node.path.node.variant.node.name.as_str();
        let offsets = enum_variant_field_offsets(ctx.type_result, item_id, variant_name).ok_or(
            CodegenError::UnsupportedNode {
                span: node.span,
                node: "enum constructor offsets",
            },
        )?;
        let payload_start =
            enum_payload_start(ctx.type_result, item_id).ok_or(CodegenError::UnsupportedNode {
                span: node.span,
                node: "enum payload start",
            })?;
        let variants = ctx.type_result.enum_variants_ordered.get(&item_id).ok_or(
            CodegenError::UnsupportedNode {
                span: node.span,
                node: "enum variants",
            },
        )?;
        let (tag, field_types) = variants
            .iter()
            .enumerate()
            .find(|(_, (name, _))| name == variant_name)
            .map(|(index, (_, fields))| (index as i64, fields))
            .ok_or(CodegenError::UnsupportedNode {
                span: node.node.path.span,
                node: "enum variant lookup",
            })?;

        let alloc_ptr = emit_alloc(ctx, node.span, layout.size, type_id)?;

        let tag_offset = ctx
            .builder
            .ins()
            .iconst(pointer_type(), payload_start as i64);
        let tag_addr = ctx.builder.ins().iadd(alloc_ptr, tag_offset);
        let tag_val = ctx
            .builder
            .ins()
            .iconst(cranelift_codegen::ir::types::I32, tag);
        ctx.builder
            .ins()
            .store(MemFlags::new(), tag_val, tag_addr, 0);

        for ((arg, field_type), offset) in node
            .node
            .args
            .iter()
            .zip(field_types.iter())
            .zip(offsets.into_iter())
        {
            let value = lower_node(arg, ctx)?.ok_or(CodegenError::UnsupportedNode {
                span: arg.span,
                node: "unit-valued enum argument",
            })?;
            let offset_val = ctx.builder.ins().iconst(pointer_type(), offset as i64);
            let field_addr = ctx.builder.ins().iadd(alloc_ptr, offset_val);
            if is_pointer_like_type(ctx.type_result, *field_type) {
                emit_write_barrier(ctx, alloc_ptr, value)?;
            }
            let _store_ty = map_type_id_to_clif(ctx.type_result, *field_type).ok_or(
                CodegenError::UnsupportedNode {
                    span: arg.span,
                    node: "enum field clif type",
                },
            )?;
            ctx.builder
                .ins()
                .store(MemFlags::new(), value, field_addr, 0);
        }

        Ok(Some(alloc_ptr))
    }
}

fn emit_alloc(
    ctx: &mut NodeLoweringContext<'_, '_>,
    span: beskid_analysis::syntax::SpanInfo,
    size: usize,
    type_id: beskid_analysis::types::TypeId,
) -> Result<Value, CodegenError> {
    let mut signature = Signature::new(CallConv::SystemV);
    signature.params.push(AbiParam::new(pointer_type()));
    signature.params.push(AbiParam::new(pointer_type()));
    signature.returns.push(AbiParam::new(pointer_type()));
    let sig_ref = ctx.builder.func.import_signature(signature);
    let func_ref = ctx
        .builder
        .func
        .import_function(cranelift_codegen::ir::ExtFuncData {
            name: ExternalName::testcase("alloc".to_string()),
            signature: sig_ref,
            colocated: false,
            patchable: false,
        });
    let size_val = ctx.builder.ins().iconst(pointer_type(), size as i64);
    let desc_name = descriptor_symbol_name(type_id);
    let desc_gv = ctx
        .builder
        .func
        .create_global_value(GlobalValueData::Symbol {
            name: ExternalName::testcase(desc_name),
            offset: 0.into(),
            colocated: false,
            tls: false,
        });
    let desc_val = ctx.builder.ins().global_value(pointer_type(), desc_gv);
    let call = ctx.builder.ins().call(func_ref, &[size_val, desc_val]);
    let result =
        ctx.builder
            .inst_results(call)
            .get(0)
            .copied()
            .ok_or(CodegenError::UnsupportedNode {
                span,
                node: "alloc result",
            })?;
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
    let func_ref = ctx
        .builder
        .func
        .import_function(cranelift_codegen::ir::ExtFuncData {
            name: ExternalName::testcase("gc_write_barrier".to_string()),
            signature: sig_ref,
            colocated: false,
            patchable: false,
        });
    ctx.builder.ins().call(func_ref, &[dst_obj, value_ptr]);
    Ok(())
}
