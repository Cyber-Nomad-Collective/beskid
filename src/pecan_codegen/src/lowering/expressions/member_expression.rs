use crate::errors::CodegenError;
use crate::lowering::descriptor::struct_field_offsets;
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use cranelift_codegen::ir::{InstBuilder, MemFlags, Value};
use pecan_analysis::hir::HirMemberExpression;
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::TypeInfo;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirMemberExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let target_value = lower_node(&node.node.target, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.target.span,
            node: "unit-valued member target",
        })?;
        let target_type = ctx
            .type_result
            .expr_types
            .get(&node.node.target.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.target.span,
            })?;
        let item_id = match ctx.type_result.types.get(target_type) {
            Some(TypeInfo::Named(item_id)) => *item_id,
            _ => {
                return Err(CodegenError::UnsupportedNode {
                    span: node.node.target.span,
                    node: "member target type",
                })
            }
        };
        let offsets = struct_field_offsets(ctx.type_result, item_id).ok_or(CodegenError::UnsupportedNode {
            span: node.span,
            node: "member offsets",
        })?;
        let field_name = node.node.member.node.name.as_str();
        let offset = offsets.get(field_name).copied().ok_or(CodegenError::UnsupportedNode {
            span: node.node.member.span,
            node: "member offset",
        })?;
        let field_type = ctx
            .type_result
            .struct_fields_ordered
            .get(&item_id)
            .and_then(|fields| fields.iter().find(|(name, _)| name == field_name))
            .map(|(_, ty)| *ty)
            .ok_or(CodegenError::UnsupportedNode {
                span: node.node.member.span,
                node: "member field type",
            })?;
        let clif_ty = map_type_id_to_clif(ctx.type_result, field_type).ok_or(CodegenError::UnsupportedNode {
            span: node.node.member.span,
            node: "member field clif type",
        })?;
        let offset_val = ctx.builder.ins().iconst(pointer_type(), offset as i64);
        let addr = ctx.builder.ins().iadd(target_value, offset_val);
        let value = ctx.builder.ins().load(clif_ty, MemFlags::new(), addr, 0);
        Ok(Some(value))
    }
}
