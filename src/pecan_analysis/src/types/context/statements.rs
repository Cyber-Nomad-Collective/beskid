use crate::hir::{
    HirPrimitiveType, HirRangeExpression, HirStatementNode, HirBlock,
};
use crate::syntax::Spanned;

use super::context::{TypeContext, TypeError};

impl<'a> TypeContext<'a> {
    pub(super) fn type_block(&mut self, block: &Spanned<HirBlock>) {
        for statement in &block.node.statements {
            self.type_statement(statement);
        }
    }

    pub(super) fn type_statement(&mut self, statement: &Spanned<HirStatementNode>) {
        match &statement.node {
            HirStatementNode::LetStatement(let_stmt) => {
                let expected = match &let_stmt.node.type_annotation {
                    Some(ty) => self.type_id_for_type(ty),
                    None => {
                        self.errors.push(TypeError::MissingTypeAnnotation {
                            span: let_stmt.node.name.span,
                            name: let_stmt.node.name.node.name.clone(),
                        });
                        None
                    }
                };
                let actual = self.type_expression(&let_stmt.node.value);
                if let (Some(expected), Some(actual)) = (expected, actual) {
                    self.require_same_type(let_stmt.node.name.span, expected, actual);
                    self.insert_local_type(let_stmt.node.name.span, expected);
                }
            }
            HirStatementNode::ReturnStatement(return_stmt) => {
                let actual = return_stmt
                    .node
                    .value
                    .as_ref()
                    .and_then(|expr| self.type_expression(expr));
                if let Some(expected) = self.current_return_type {
                    match actual {
                        Some(actual) => self.require_same_type(return_stmt.span, expected, actual),
                        None => {
                            if expected != self.primitive_type_id(HirPrimitiveType::Unit).unwrap() {
                                self.errors.push(TypeError::ReturnTypeMismatch {
                                    span: return_stmt.span,
                                    expected,
                                    actual: None,
                                });
                            }
                        }
                    }
                }
            }
            HirStatementNode::WhileStatement(while_stmt) => {
                self.require_bool(while_stmt.node.condition.span, &while_stmt.node.condition);
                self.type_block(&while_stmt.node.body);
            }
            HirStatementNode::ForStatement(for_stmt) => {
                let range_type = self.type_range_expression(&for_stmt.node.range);
                if let Some(type_id) = range_type {
                    self.insert_local_type(for_stmt.node.iterator.span, type_id);
                }
                self.type_block(&for_stmt.node.body);
            }
            HirStatementNode::IfStatement(if_stmt) => {
                self.require_bool(if_stmt.node.condition.span, &if_stmt.node.condition);
                self.type_block(&if_stmt.node.then_block);
                if let Some(else_block) = &if_stmt.node.else_block {
                    self.type_block(else_block);
                }
            }
            HirStatementNode::ExpressionStatement(expr_stmt) => {
                self.type_expression(&expr_stmt.node.expression);
            }
            HirStatementNode::BreakStatement(_) | HirStatementNode::ContinueStatement(_) => {}
        }
    }

    pub(super) fn type_range_expression(
        &mut self,
        range: &Spanned<HirRangeExpression>,
    ) -> Option<crate::types::TypeId> {
        let start = self.type_expression(&range.node.start);
        let end = self.type_expression(&range.node.end);
        match (start, end) {
            (Some(start), Some(end)) => {
                if start != end || !self.is_numeric(start) {
                    self.errors.push(TypeError::TypeMismatch {
                        span: range.span,
                        expected: start,
                        actual: end,
                    });
                    return None;
                }
                Some(start)
            }
            _ => None,
        }
    }
}
