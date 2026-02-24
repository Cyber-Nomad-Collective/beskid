use crate::hir::{
    ExpressionNode, HirAssignExpression, HirBinaryExpression, HirBinaryOp, HirBlock,
    HirExpressionNode, HirExpressionStatement, HirLetStatement, HirLiteral,
    HirLiteralExpression, HirPath, HirPathExpression, HirProgram, HirStatementNode,
    HirWhileStatement, StatementNode,
};
use crate::syntax::Spanned;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HirNormalizeError {
    // Placeholder for future normalization errors
}

pub fn normalize_program(
    program: &mut Spanned<HirProgram>,
) -> Result<(), Vec<HirNormalizeError>> {
    let mut normalizer = Normalizer::new();
    normalizer.visit_program(program);
    if normalizer.errors.is_empty() {
        Ok(())
    } else {
        Err(normalizer.errors)
    }
}

struct Normalizer {
    errors: Vec<HirNormalizeError>,
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

    fn visit_block(&mut self, block: &mut Spanned<HirBlock>) {
        let mut new_statements = Vec::new();
        let statements = std::mem::take(&mut block.node.statements);
        for statement in statements {
            let mut expansion = self.visit_statement(statement);
            new_statements.append(&mut expansion);
        }
        block.node.statements = new_statements;
    }

    fn visit_statement(
        &mut self,
        statement: Spanned<HirStatementNode>,
    ) -> Vec<Spanned<HirStatementNode>> {
        let span = statement.span;
        match statement.node {
            HirStatementNode::LetStatement(mut let_stmt) => {
                self.visit_expression(&mut let_stmt.node.value);
                vec![Spanned::new(HirStatementNode::LetStatement(let_stmt), span)]
            }
            HirStatementNode::ReturnStatement(mut return_stmt) => {
                if let Some(value) = &mut return_stmt.node.value {
                    self.visit_expression(value);
                }
                vec![Spanned::new(HirStatementNode::ReturnStatement(return_stmt), span)]
            }
            HirStatementNode::WhileStatement(mut while_stmt) => {
                self.visit_expression(&mut while_stmt.node.condition);
                self.visit_block(&mut while_stmt.node.body);
                vec![Spanned::new(HirStatementNode::WhileStatement(while_stmt), span)]
            }
            HirStatementNode::ForStatement(mut for_stmt) => {
                self.visit_expression(&mut for_stmt.node.range.node.start);
                self.visit_expression(&mut for_stmt.node.range.node.end);
                self.visit_block(&mut for_stmt.node.body);

                // Desugar for loop:
                // let mut iterator = start;
                // while iterator < end {
                //     body;
                //     iterator = iterator + 1;
                // }

                let iterator_name = for_stmt.node.iterator;
                let start_expr = for_stmt.node.range.node.start;
                let end_expr = for_stmt.node.range.node.end;
                let mut while_body = for_stmt.node.body;

                let init_stmt_node = HirLetStatement {
                    mutable: true,
                    name: iterator_name.clone(),
                    type_annotation: None,
                    value: start_expr,
                };
                let init_stmt = Spanned::new(
                    StatementNode::LetStatement(Spanned::new(
                        init_stmt_node,
                        span,
                    )),
                    span,
                );

                let iterator_path = Spanned::new(
                    ExpressionNode::PathExpression(Spanned::new(
                        HirPathExpression {
                            path: Spanned::new(
                                HirPath {
                                    segments: vec![iterator_name.clone()],
                                },
                                iterator_name.span,
                            ),
                        },
                        iterator_name.span,
                    )),
                    iterator_name.span,
                );

                let iterator_path_2 = Spanned::new(
                    ExpressionNode::PathExpression(Spanned::new(
                        HirPathExpression {
                            path: Spanned::new(
                                HirPath {
                                    segments: vec![iterator_name.clone()],
                                },
                                iterator_name.span,
                            ),
                        },
                        iterator_name.span,
                    )),
                    iterator_name.span,
                );

                let iterator_path_3 = Spanned::new(
                    ExpressionNode::PathExpression(Spanned::new(
                        HirPathExpression {
                            path: Spanned::new(
                                HirPath {
                                    segments: vec![iterator_name.clone()],
                                },
                                iterator_name.span,
                            ),
                        },
                        iterator_name.span,
                    )),
                    iterator_name.span,
                );

                let condition = Spanned::new(
                    ExpressionNode::BinaryExpression(Spanned::new(
                        HirBinaryExpression {
                            left: Box::new(iterator_path),
                            op: Spanned::new(HirBinaryOp::Lt, span),
                            right: Box::new(end_expr),
                        },
                        span,
                    )),
                    span,
                );

                let increment_expr = Spanned::new(
                    ExpressionNode::AssignExpression(Spanned::new(
                        HirAssignExpression {
                            target: Box::new(iterator_path_2),
                            value: Box::new(Spanned::new(
                                ExpressionNode::BinaryExpression(Spanned::new(
                                    HirBinaryExpression {
                                        left: Box::new(iterator_path_3),
                                        op: Spanned::new(HirBinaryOp::Add, span),
                                        right: Box::new(Spanned::new(
                                            ExpressionNode::LiteralExpression(Spanned::new(
                                                HirLiteralExpression {
                                                    literal: Spanned::new(
                                                        HirLiteral::Integer("1".to_string()),
                                                        span,
                                                    ),
                                                },
                                                span,
                                            )),
                                            span,
                                        )),
                                    },
                                    span,
                                )),
                                span,
                            )),
                        },
                        span,
                    )),
                    span,
                );

                let increment_stmt = Spanned::new(
                    StatementNode::ExpressionStatement(Spanned::new(
                        HirExpressionStatement {
                            expression: increment_expr,
                        },
                        span,
                    )),
                    span,
                );

                while_body.node.statements.push(increment_stmt);

                let while_stmt = Spanned::new(
                    StatementNode::WhileStatement(Spanned::new(
                        HirWhileStatement {
                            condition,
                            body: while_body,
                        },
                        span,
                    )),
                    span,
                );

                vec![init_stmt, while_stmt]
            }
            HirStatementNode::IfStatement(mut if_stmt) => {
                self.visit_expression(&mut if_stmt.node.condition);
                self.visit_block(&mut if_stmt.node.then_block);
                if let Some(else_block) = &mut if_stmt.node.else_block {
                    self.visit_block(else_block);
                }
                vec![Spanned::new(HirStatementNode::IfStatement(if_stmt), span)]
            }
            HirStatementNode::ExpressionStatement(mut expr_stmt) => {
                self.visit_expression(&mut expr_stmt.node.expression);
                vec![Spanned::new(HirStatementNode::ExpressionStatement(expr_stmt), span)]
            }
            HirStatementNode::BreakStatement(break_stmt) => {
                vec![Spanned::new(HirStatementNode::BreakStatement(break_stmt), span)]
            }
            HirStatementNode::ContinueStatement(continue_stmt) => {
                vec![Spanned::new(HirStatementNode::ContinueStatement(continue_stmt), span)]
            }
        }
    }

    fn visit_expression(&mut self, expr: &mut Spanned<HirExpressionNode>) {
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
