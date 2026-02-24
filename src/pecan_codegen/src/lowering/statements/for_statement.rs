use crate::errors::CodegenError;
use crate::lowering::cast_intent::ensure_type_compatibility;
use crate::lowering::function::LoopControl;
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::map_type_id_to_clif;
use cranelift_codegen::ir::condcodes::{FloatCC, IntCC};
use cranelift_codegen::ir::{types, InstBuilder};
use pecan_analysis::hir::{HirForStatement, HirPrimitiveType};
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::TypeInfo;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirForStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let local_id = ctx
            .resolution
            .tables
            .locals
            .iter()
            .find(|info| info.span == node.node.iterator.span)
            .map(|info| info.id)
            .ok_or(CodegenError::InvalidLocalBinding {
                span: node.node.iterator.span,
            })?;
        let local_type = ctx
            .type_result
            .local_types
            .get(&local_id)
            .copied()
            .ok_or(CodegenError::MissingLocalType {
                span: node.node.iterator.span,
            })?;
        let local_info = ctx.type_result.types.get(local_type);
        let local_clif_ty = map_type_id_to_clif(ctx.type_result, local_type).ok_or(
            CodegenError::UnsupportedNode {
                span: node.node.iterator.span,
                node: "for iterator type",
            },
        )?;

        let start_value = lower_node(&node.node.range.node.start, ctx)?.ok_or(
            CodegenError::UnsupportedNode {
                span: node.node.range.node.start.span,
                node: "unit-valued range start",
            },
        )?;
        let start_type = ctx
            .type_result
            .expr_types
            .get(&node.node.range.node.start.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.range.node.start.span,
            })?;
        ensure_type_compatibility(
            node.node.range.node.start.span,
            local_type,
            start_type,
            ctx.type_result,
        )?;

        let end_value = lower_node(&node.node.range.node.end, ctx)?.ok_or(
            CodegenError::UnsupportedNode {
                span: node.node.range.node.end.span,
                node: "unit-valued range end",
            },
        )?;
        let end_type = ctx
            .type_result
            .expr_types
            .get(&node.node.range.node.end.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.range.node.end.span,
            })?;
        ensure_type_compatibility(
            node.node.range.node.end.span,
            local_type,
            end_type,
            ctx.type_result,
        )?;

        let iterator_var = ctx.builder.declare_var(local_clif_ty);
        ctx.builder.def_var(iterator_var, start_value);
        ctx.state.locals.insert(local_id, iterator_var);

        let end_var = ctx.builder.declare_var(local_clif_ty);
        ctx.builder.def_var(end_var, end_value);

        let header_block = ctx.builder.create_block();
        let body_block = ctx.builder.create_block();
        let increment_block = ctx.builder.create_block();
        let exit_block = ctx.builder.create_block();

        ctx.builder.ins().jump(header_block, &[]);
        ctx.builder.switch_to_block(header_block);

        let iterator_value = ctx.builder.use_var(iterator_var);
        let end_value = ctx.builder.use_var(end_var);
        let comparison = match local_info {
            Some(TypeInfo::Primitive(HirPrimitiveType::F64)) => {
                ctx.builder.ins().fcmp(FloatCC::LessThan, iterator_value, end_value)
            }
            Some(TypeInfo::Primitive(HirPrimitiveType::U8)) => {
                ctx.builder.ins().icmp(IntCC::UnsignedLessThan, iterator_value, end_value)
            }
            Some(TypeInfo::Primitive(HirPrimitiveType::I32 | HirPrimitiveType::I64)) => {
                ctx.builder.ins().icmp(IntCC::SignedLessThan, iterator_value, end_value)
            }
            _ => {
                return Err(CodegenError::UnsupportedNode {
                    span: node.node.iterator.span,
                    node: "for iterator comparison type",
                });
            }
        };
        let condition = ctx.builder.ins().uextend(types::I8, comparison);
        ctx.builder.ins().brif(condition, body_block, &[], exit_block, &[]);

        ctx.builder.switch_to_block(body_block);
        ctx.state.loop_stack.push(LoopControl {
            continue_block: increment_block,
            break_block: exit_block,
        });
        ctx.state.block_terminated = false;
        for statement in &node.node.body.node.statements {
            lower_node(statement, ctx)?;
            if ctx.state.block_terminated {
                break;
            }
        }
        ctx.state.loop_stack.pop();
        if !ctx.state.block_terminated {
            ctx.builder.ins().jump(increment_block, &[]);
        }

        ctx.state.block_terminated = false;
        ctx.builder.switch_to_block(increment_block);
        let current_value = ctx.builder.use_var(iterator_var);
        let increment = match local_info {
            Some(TypeInfo::Primitive(HirPrimitiveType::F64)) => {
                let one = ctx.builder.ins().f64const(1.0);
                ctx.builder.ins().fadd(current_value, one)
            }
            Some(TypeInfo::Primitive(_)) if local_clif_ty.is_int() => {
                let one = ctx.builder.ins().iconst(local_clif_ty, 1);
                ctx.builder.ins().iadd(current_value, one)
            }
            _ => {
                return Err(CodegenError::UnsupportedNode {
                    span: node.node.iterator.span,
                    node: "for iterator increment type",
                });
            }
        };
        ctx.builder.def_var(iterator_var, increment);
        ctx.builder.ins().jump(header_block, &[]);

        ctx.builder.switch_to_block(exit_block);
        Ok(())
    }
}
