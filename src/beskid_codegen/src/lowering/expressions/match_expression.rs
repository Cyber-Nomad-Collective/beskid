use crate::errors::CodegenError;
use crate::lowering::descriptor::{enum_payload_start, enum_variant_field_offsets};
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use cranelift_codegen::ir::condcodes::IntCC;
use cranelift_codegen::ir::{InstBuilder, MemFlags, Value};
use beskid_analysis::hir::{HirMatchExpression, HirPattern};
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::TypeInfo;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirMatchExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let scrutinee = lower_node(&node.node.scrutinee, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.scrutinee.span,
            node: "unit-valued match scrutinee",
        })?;
        let scrutinee_type = ctx
            .type_result
            .expr_types
            .get(&node.node.scrutinee.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.scrutinee.span,
            })?;
        let item_id = match ctx.type_result.types.get(scrutinee_type) {
            Some(TypeInfo::Named(item_id)) => *item_id,
            _ => {
                return Err(CodegenError::UnsupportedNode {
                    span: node.node.scrutinee.span,
                    node: "match scrutinee type",
                })
            }
        };
        let variants = ctx
            .type_result
            .enum_variants_ordered
            .get(&item_id)
            .ok_or(CodegenError::UnsupportedNode {
                span: node.span,
                node: "match enum variants",
            })?;
        let payload_start = enum_payload_start(ctx.type_result, item_id).ok_or(CodegenError::UnsupportedNode {
            span: node.span,
            node: "match payload start",
        })?;

        let result_type = ctx.type_result.expr_types.get(&node.span).copied();
        let result_clif = result_type.and_then(|ty| map_type_id_to_clif(ctx.type_result, ty));
        let result_var = result_clif.map(|clif_ty| ctx.builder.declare_var(clif_ty));
        let merge_block = ctx.builder.create_block();

        if ctx.builder.current_block().is_none() {
            return Err(CodegenError::UnsupportedNode {
                span: node.span,
                node: "missing current block",
            });
        }

        for (index, arm) in node.node.arms.iter().enumerate() {
            let is_last = index + 1 == node.node.arms.len();
            let arm_block = ctx.builder.create_block();
            let next_block = if is_last {
                merge_block
            } else {
                ctx.builder.create_block()
            };

            match &arm.node.pattern.node {
                HirPattern::Wildcard | HirPattern::Identifier(_) => {
                    ctx.builder.ins().jump(arm_block, &[]);
                }
                HirPattern::Enum(enum_pattern) => {
                    let variant_name = enum_pattern.node.path.node.variant.node.name.as_str();
                    let tag = variants
                        .iter()
                        .enumerate()
                        .find(|(_, (name, _))| name == variant_name)
                        .map(|(idx, _)| idx as i64)
                        .ok_or(CodegenError::UnsupportedNode {
                            span: enum_pattern.span,
                            node: "match variant tag",
                        })?;
                    let tag_offset = ctx.builder.ins().iconst(pointer_type(), payload_start as i64);
                    let tag_addr = ctx.builder.ins().iadd(scrutinee, tag_offset);
                    let tag_val = ctx.builder.ins().load(cranelift_codegen::ir::types::I32, MemFlags::new(), tag_addr, 0);
                    let tag_const = ctx.builder.ins().iconst(cranelift_codegen::ir::types::I32, tag);
                    let cond = ctx.builder.ins().icmp(IntCC::Equal, tag_val, tag_const);
                    ctx.builder.ins().brif(cond, arm_block, &[], next_block, &[]);
                }
                _ => {
                    return Err(CodegenError::UnsupportedNode {
                        span: arm.node.pattern.span,
                        node: "match pattern",
                    })
                }
            }
            ctx.builder.switch_to_block(arm_block);
            ctx.builder.seal_block(arm_block);
            let saved_locals = ctx.state.locals.clone();
            bind_match_pattern(ctx, scrutinee, item_id, variants, arm)?;

            if arm.node.guard.is_some() {
                let guard_block = ctx.builder.create_block();
                let guard_val = lower_node(arm.node.guard.as_ref().unwrap(), ctx)?.ok_or(
                    CodegenError::UnsupportedNode {
                        span: arm.node.guard.as_ref().unwrap().span,
                        node: "unit-valued match guard",
                    },
                )?;
                ctx.builder.ins().brif(guard_val, guard_block, &[], next_block, &[]);
                ctx.builder.switch_to_block(guard_block);
                ctx.builder.seal_block(guard_block);
            }

            let arm_value = lower_node(&arm.node.value, ctx)?;
            if let Some(var) = result_var {
                let value = arm_value.ok_or(CodegenError::UnsupportedNode {
                    span: arm.node.value.span,
                    node: "unit-valued match arm",
                })?;
                ctx.builder.def_var(var, value);
            }
            ctx.builder.ins().jump(merge_block, &[]);
            ctx.state.locals = saved_locals;

            if !is_last {
                ctx.builder.seal_block(next_block);
                ctx.builder.switch_to_block(next_block);
            }
        }

        ctx.builder.seal_block(merge_block);
        ctx.builder.switch_to_block(merge_block);
        if let Some(var) = result_var {
            Ok(Some(ctx.builder.use_var(var)))
        } else {
            Ok(None)
        }
    }
}

fn bind_match_pattern(
    ctx: &mut NodeLoweringContext<'_, '_>,
    scrutinee: Value,
    item_id: beskid_analysis::resolve::ItemId,
    variants: &[(String, Vec<beskid_analysis::types::TypeId>)],
    arm: &Spanned<beskid_analysis::hir::HirMatchArm>,
) -> Result<(), CodegenError> {
    match &arm.node.pattern.node {
        HirPattern::Identifier(identifier) => {
            bind_local(ctx, identifier.span, scrutinee)
        }
        HirPattern::Enum(enum_pattern) => {
            let variant_name = enum_pattern.node.path.node.variant.node.name.as_str();
            let field_types = variants
                .iter()
                .find(|(name, _)| name == variant_name)
                .map(|(_, fields)| fields)
                .ok_or(CodegenError::UnsupportedNode {
                    span: enum_pattern.span,
                    node: "match variant fields",
                })?;
            let offsets = enum_variant_field_offsets(ctx.type_result, item_id, variant_name)
                .ok_or(CodegenError::UnsupportedNode {
                    span: enum_pattern.span,
                    node: "match variant offsets",
                })?;
            for ((item, field_type), offset) in enum_pattern
                .node
                .items
                .iter()
                .zip(field_types.iter())
                .zip(offsets.into_iter())
            {
                match &item.node {
                    HirPattern::Identifier(identifier) => {
                        let clif_ty = map_type_id_to_clif(ctx.type_result, *field_type).ok_or(
                            CodegenError::UnsupportedNode {
                                span: identifier.span,
                                node: "match binding type",
                            },
                        )?;
                        let offset_val = ctx.builder.ins().iconst(pointer_type(), offset as i64);
                        let addr = ctx.builder.ins().iadd(scrutinee, offset_val);
                        let value = ctx.builder.ins().load(clif_ty, MemFlags::new(), addr, 0);
                        bind_local(ctx, identifier.span, value)?;
                    }
                    HirPattern::Wildcard => {}
                    _ => {
                        return Err(CodegenError::UnsupportedNode {
                            span: item.span,
                            node: "match pattern item",
                        })
                    }
                }
            }
            Ok(())
        }
        HirPattern::Wildcard | HirPattern::Literal(_) => Ok(()),
    }
}

fn bind_local(
    ctx: &mut NodeLoweringContext<'_, '_>,
    span: beskid_analysis::syntax::SpanInfo,
    value: Value,
) -> Result<(), CodegenError> {
    let local_id = ctx
        .resolution
        .tables
        .locals
        .iter()
        .find(|info| info.span == span)
        .map(|info| info.id)
        .ok_or(CodegenError::InvalidLocalBinding { span })?;
    let type_id = ctx
        .type_result
        .local_types
        .get(&local_id)
        .copied()
        .ok_or(CodegenError::MissingLocalType { span })?;
    let clif_ty = map_type_id_to_clif(ctx.type_result, type_id).ok_or(CodegenError::UnsupportedNode {
        span,
        node: "match binding clif type",
    })?;
    let var = ctx.builder.declare_var(clif_ty);
    ctx.builder.def_var(var, value);
    ctx.state.locals.insert(local_id, var);
    Ok(())
}
