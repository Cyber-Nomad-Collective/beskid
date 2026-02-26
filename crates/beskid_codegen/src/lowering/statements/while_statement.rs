use crate::errors::CodegenError;
use crate::lowering::function::LoopControl;
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use beskid_analysis::hir::{HirPrimitiveType, HirWhileStatement};
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::TypeInfo;
use cranelift_codegen::ir::InstBuilder;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirWhileStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let header_block = ctx.builder.create_block();
        let body_block = ctx.builder.create_block();
        let exit_block = ctx.builder.create_block();

        ctx.builder.ins().jump(header_block, &[]);
        ctx.builder.switch_to_block(header_block);

        let condition =
            lower_node(&node.node.condition, ctx)?.ok_or(CodegenError::UnsupportedNode {
                span: node.node.condition.span,
                node: "unit-valued while condition",
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
                node: "non-bool while condition",
            });
        }

        ctx.builder
            .ins()
            .brif(condition, body_block, &[], exit_block, &[]);

        ctx.builder.switch_to_block(body_block);
        ctx.builder.seal_block(body_block);
        ctx.state.loop_stack.push(LoopControl {
            continue_block: header_block,
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
            ctx.builder.ins().jump(header_block, &[]);
        }

        ctx.builder.seal_block(header_block);
        ctx.state.block_terminated = false;
        ctx.builder.switch_to_block(exit_block);
        ctx.builder.seal_block(exit_block);
        Ok(())
    }
}
