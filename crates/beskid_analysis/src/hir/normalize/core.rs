use crate::hir::{HirBlock, HirExpressionNode, HirProgram};
use crate::syntax::Spanned;

use super::normalizable::Normalize;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HirNormalizeError {
    // Placeholder for future normalization errors
}

pub fn normalize_program(program: &mut Spanned<HirProgram>) -> Result<(), Vec<HirNormalizeError>> {
    let mut normalizer = Normalizer::new();
    normalizer.visit_program(program);
    if normalizer.errors.is_empty() {
        Ok(())
    } else {
        Err(normalizer.errors)
    }
}

pub struct Normalizer {
    pub(crate) errors: Vec<HirNormalizeError>,
}

impl Normalizer {
    fn new() -> Self {
        Self { errors: Vec::new() }
    }

    fn visit_program(&mut self, program: &mut Spanned<HirProgram>) {
        for item in &mut program.node.items {
            self.visit_item(item);
        }
    }

    fn visit_item(&mut self, item: &mut Spanned<crate::hir::HirItem>) {
        match &mut item.node {
            crate::hir::Item::FunctionDefinition(def) => {
                self.visit_block(&mut def.node.body);
            }
            crate::hir::Item::MethodDefinition(def) => {
                self.visit_block(&mut def.node.body);
            }
            _ => {}
        }
    }

    pub fn visit_block(&mut self, block: &mut Spanned<HirBlock>) {
        let mut new_statements = Vec::new();
        let statements = std::mem::take(&mut block.node.statements);
        for statement in statements {
            let mut expansion = statement.normalize(self);
            new_statements.append(&mut expansion);
        }
        block.node.statements = new_statements;
    }

    pub fn visit_expression(&mut self, expr: &mut Spanned<HirExpressionNode>) {
        match &mut expr.node {
            HirExpressionNode::MatchExpression(match_expr) => {
                self.visit_expression(&mut match_expr.node.scrutinee);
                for arm in &mut match_expr.node.arms {
                    if let Some(guard) = &mut arm.node.guard {
                        self.visit_expression(guard);
                    }
                    self.visit_expression(&mut arm.node.value);
                }
            }
            HirExpressionNode::AssignExpression(assign_expr) => {
                self.visit_expression(&mut assign_expr.node.target);
                self.visit_expression(&mut assign_expr.node.value);
            }
            HirExpressionNode::BinaryExpression(binary_expr) => {
                self.visit_expression(&mut binary_expr.node.left);
                self.visit_expression(&mut binary_expr.node.right);
            }
            HirExpressionNode::UnaryExpression(unary_expr) => {
                self.visit_expression(&mut unary_expr.node.expr);
            }
            HirExpressionNode::CallExpression(call_expr) => {
                self.visit_expression(&mut call_expr.node.callee);
                for arg in &mut call_expr.node.args {
                    self.visit_expression(arg);
                }
            }
            HirExpressionNode::MemberExpression(member_expr) => {
                self.visit_expression(&mut member_expr.node.target);
            }
            HirExpressionNode::StructLiteralExpression(struct_literal) => {
                for field in &mut struct_literal.node.fields {
                    self.visit_expression(&mut field.node.value);
                }
            }
            HirExpressionNode::EnumConstructorExpression(enum_constructor) => {
                for arg in &mut enum_constructor.node.args {
                    self.visit_expression(arg);
                }
            }
            HirExpressionNode::BlockExpression(block_expr) => {
                self.visit_block(&mut block_expr.node.block);
            }
            HirExpressionNode::GroupedExpression(grouped_expr) => {
                self.visit_expression(&mut grouped_expr.node.expr);
            }
            HirExpressionNode::LiteralExpression(_) | HirExpressionNode::PathExpression(_) => {}
        }
    }
}
