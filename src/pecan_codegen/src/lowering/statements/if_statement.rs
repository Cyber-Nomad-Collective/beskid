use crate::errors::CodegenError;
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::InstBuilder;
use pecan_analysis::hir::{HirIfStatement, HirPrimitiveType};
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::TypeInfo;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirIfStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let condition = lower_node(&node.node.condition, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.condition.span,
            node: "unit-valued if condition",
        })?;
        let condition_type = ctx
            .type_result
            .expr_types
            .get(&node.node.condition.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.condition.span,
            })?;
        let is_bool = matches!(
            ctx.type_result.types.get(condition_type),
            Some(TypeInfo::Primitive(HirPrimitiveType::Bool))
        );
        if !is_bool {
            return Err(CodegenError::UnsupportedNode {
                span: node.node.condition.span,
                node: "non-bool if condition",
            });
        }

        let then_block = ctx.builder.create_block();
        let merge_block = ctx.builder.create_block();
        let else_block = node.node.else_block.as_ref().map(|_| ctx.builder.create_block());

        if let Some(else_block) = else_block {
            ctx.builder.ins().brif(condition, then_block, &[], else_block, &[]);
        } else {
            ctx.builder.ins().brif(condition, then_block, &[], merge_block, &[]);
        }

        ctx.builder.switch_to_block(then_block);
        ctx.builder.seal_block(then_block);
        ctx.state.block_terminated = false;
        ctx.state.return_emitted = false;
        for statement in &node.node.then_block.node.statements {
            lower_node(statement, ctx)?;
            if ctx.state.block_terminated {
                break;
            }
        }
        let then_returned = ctx.state.return_emitted;
        let then_terminated = ctx.state.block_terminated;
        if !then_terminated {
            ctx.builder.ins().jump(merge_block, &[]);
        }

        if let Some(else_block) = else_block {
            ctx.state.block_terminated = false;
            ctx.state.return_emitted = false;
            ctx.builder.switch_to_block(else_block);
            ctx.builder.seal_block(else_block);
            for statement in &node.node.else_block.as_ref().unwrap().node.statements {
                lower_node(statement, ctx)?;
                if ctx.state.block_terminated {
                    break;
                }
            }
            let else_returned = ctx.state.return_emitted;
            let else_terminated = ctx.state.block_terminated;
            if !else_terminated {
                ctx.builder.ins().jump(merge_block, &[]);
            }
            ctx.state.return_emitted = then_returned && else_returned;
            ctx.state.block_terminated = then_terminated && else_terminated;
        } else {
            ctx.state.return_emitted = false;
            ctx.state.block_terminated = false;
        }

        ctx.builder.seal_block(merge_block);
        ctx.builder.switch_to_block(merge_block);
        Ok(())
    }
}
