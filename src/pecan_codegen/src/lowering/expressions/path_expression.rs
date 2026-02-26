use crate::errors::CodegenError;
use crate::lowering::descriptor::struct_field_offsets;
use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use cranelift_codegen::ir::{InstBuilder, MemFlags, Value};
use pecan_analysis::hir::HirPathExpression;
use pecan_analysis::resolve::ResolvedValue;
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::TypeInfo;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirPathExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        let segments = &node.node.path.node.segments;
        if segments.is_empty() {
            return Err(CodegenError::UnsupportedNode {
                span: node.span,
                node: "empty path expression",
            });
        }

        let resolved = ctx
            .resolution
            .tables
            .resolved_values
            .get(&node.node.path.span)
            .ok_or(CodegenError::MissingResolvedValue {
                span: node.node.path.span,
            })?;

        match resolved {
            ResolvedValue::Local(local_id) => {
                let var = ctx.state.locals.get(local_id).copied().ok_or(CodegenError::InvalidLocalBinding {
                    span: node.node.path.span,
                })?;
                let mut value = ctx.builder.use_var(var);
                if segments.len() == 1 {
                    return Ok(Some(value));
                }
                let mut current_type = ctx
                    .type_result
                    .local_types
                    .get(local_id)
                    .copied()
                    .ok_or(CodegenError::MissingLocalType {
                        span: node.node.path.span,
                    })?;
                for segment in segments.iter().skip(1) {
                    let item_id = match ctx.type_result.types.get(current_type) {
                        Some(TypeInfo::Named(item_id)) => *item_id,
                        _ => {
                            return Err(CodegenError::UnsupportedNode {
                                span: segment.span,
                                node: "member target type",
                            })
                        }
                    };
                    let offsets = struct_field_offsets(ctx.type_result, item_id).ok_or(CodegenError::UnsupportedNode {
                        span: segment.span,
                        node: "member offsets",
                    })?;
                    let field_name = segment.node.name.node.name.as_str();
                    let offset = offsets.get(field_name).copied().ok_or(CodegenError::UnsupportedNode {
                        span: segment.span,
                        node: "member offset",
                    })?;
                    let field_type = ctx
                        .type_result
                        .struct_fields_ordered
                        .get(&item_id)
                        .and_then(|fields| fields.iter().find(|(name, _)| name == field_name))
                        .map(|(_, ty)| *ty)
                        .ok_or(CodegenError::UnsupportedNode {
                            span: segment.span,
                            node: "member field type",
                        })?;
                    let clif_ty = map_type_id_to_clif(ctx.type_result, field_type).ok_or(CodegenError::UnsupportedNode {
                        span: segment.span,
                        node: "member field clif type",
                    })?;
                    let offset_val = ctx.builder.ins().iconst(pointer_type(), offset as i64);
                    let addr = ctx.builder.ins().iadd(value, offset_val);
                    value = ctx.builder.ins().load(clif_ty, MemFlags::new(), addr, 0);
                    current_type = field_type;
                }
                Ok(Some(value))
            }
            ResolvedValue::Item(_) => Err(CodegenError::UnsupportedNode {
                span: node.node.path.span,
                node: "item-valued path expression",
            }),
        }
    }
}
